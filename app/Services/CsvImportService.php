<?php

namespace App\Services;

use App\Events\CsvImportCompleted;
use App\Jobs\SendCsvToGasJob;
use App\Models\CsvUpload;
use App\Models\SalesRecord;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class CsvImportService
{
    /**
     * @return Collection<int, CsvUpload>
     */
    public function uploads(): Collection
    {
        try {
            return CsvUpload::query()
                ->orderByDesc('created_at')
                ->get();
        } catch (\Throwable $e) {
            Log::error('CsvImportService.uploads failed', ['error' => $e->getMessage()]);

            return collect();
        }
    }

    /**
     * @return array{upload_id:int,filename:string,success_count:int,failed_count:int,errors:array<int, array{row:int,message:string}>}
     */
    public function upload(UploadedFile $file, ?User $actor = null): array
    {
        try {
            $filename = $file->getClientOriginalName() ?: 'upload.csv';
            $content = $file->get();
            $text = is_string($content) ? $content : '';

            [$rows, $errors] = $this->parseCsvToSalesRecords($text);
            $success = count($rows);
            $failed = count($errors);

            $row = CsvUpload::query()->create([
                'filename' => $filename,
                'success_count' => $success,
                'failed_count' => $failed,
                'errors' => $errors,
            ]);

            foreach ($rows as $r) {
                SalesRecord::query()->create([
                    'department_id' => $actor?->department_id,
                    'csv_upload_id' => (int) $row->id,
                    'csv_row_number' => $r['csv_row_number'],
                    'staff_name' => $r['staff_name'],
                    'store_name' => $r['store_name'],
                    'sales_amount' => $r['sales_amount'],
                    'customer_count' => $r['customer_count'],
                    'status' => $r['status'],
                    'date' => $r['date'],
                    'product_name' => $r['product_name'],
                    'contract_type' => $r['contract_type'],
                    'channel' => $r['channel'],
                    'result' => $r['result'],
                    'raw' => $r['raw'],
                ]);
            }

            // GASダミー転送（Queue枠組み）
            SendCsvToGasJob::dispatch((int) $row->id, $filename, $success, $failed);

            event(new CsvImportCompleted(
                uploadId: (int) $row->id,
                filename: $filename,
                successCount: $success,
                failedCount: $failed,
                actor: $actor,
            ));

            return [
                'upload_id' => (int) $row->id,
                'filename' => $filename,
                'success_count' => $success,
                'failed_count' => $failed,
                'errors' => $errors,
            ];
        } catch (\Throwable $e) {
            Log::error('CsvImportService.upload failed', ['error' => $e->getMessage()]);
            throw new \RuntimeException('Server error.', 500);
        }
    }

    /**
     * @return array{0:array<int,array{csv_row_number:int,date:string,staff_name:string,store_name:string,sales_amount:int,customer_count:int,status:'ok'|'ng',product_name:?string,contract_type:?string,channel:?string,result:?string,raw:array<string,string>}>,1:array<int,array{row:int,message:string}>}
     */
    private function parseCsvToSalesRecords(string $text): array
    {
        $lines = preg_split("/\r\n|\n|\r/", $text) ?: [];
        $lines = array_values(array_filter($lines, fn ($l) => trim((string) $l) !== ''));
        if ($lines === []) {
            return [[], [['row' => 0, 'message' => 'CSVが空です']]];
        }

        $header = str_getcsv((string) array_shift($lines));
        $map = $this->buildHeaderMap($header);

        $rows = [];
        $errors = [];
        $rowNum = 1;
        foreach ($lines as $line) {
            $rowNum++;
            $cols = str_getcsv((string) $line);

            $date = $this->col($cols, $map, ['date', '日付']);
            $staffName = $this->col($cols, $map, ['staff_name', '担当者', 'スタッフ']);
            $storeName = $this->col($cols, $map, ['store_name', '店舗名', '店名']);
            $salesAmount = $this->col($cols, $map, ['sales_amount', '売上額', '売上']);
            $customerCount = $this->col($cols, $map, ['customer_count', '客数']);
            $productName = $this->col($cols, $map, ['product_name', '商材', '商品']);
            $contractType = $this->col($cols, $map, ['contract_type', '契約種別']);
            $channel = $this->col($cols, $map, ['channel', '流入', 'チャネル']);
            $statusRaw = $this->col($cols, $map, ['status', 'ステータス', '判定', '合否']);
            $result = $this->col($cols, $map, ['result', '結果', '成約']);

            if ($date === '' || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
                $errors[] = ['row' => $rowNum, 'message' => '日付が不正です'];

                continue;
            }
            if ($staffName === '') {
                $errors[] = ['row' => $rowNum, 'message' => '担当者が空です'];

                continue;
            }

            $amount = (int) preg_replace('/[^\d]/', '', $salesAmount);
            $count = (int) preg_replace('/[^\d]/', '', $customerCount);

            $raw = $this->rawAssoc($header, $cols);

            $rows[] = [
                'csv_row_number' => $rowNum,
                'date' => $date,
                'staff_name' => $staffName,
                'store_name' => $storeName,
                'sales_amount' => max(0, $amount),
                'customer_count' => max(0, $count),
                'status' => $this->inferCsvStatus($statusRaw, $result),
                'product_name' => $productName !== '' ? $productName : null,
                'contract_type' => $contractType !== '' ? $contractType : null,
                'channel' => $channel !== '' ? $channel : null,
                'result' => $result !== '' ? $result : null,
                'raw' => $raw,
            ];
        }

        return [$rows, $errors];
    }

    private function inferCsvStatus(string $explicit, string $resultText): string
    {
        $e = mb_strtolower(trim($explicit));
        if (in_array($e, ['ng', '×', 'x', 'false', '0'], true)) {
            return 'ng';
        }
        if (in_array($e, ['ok', '○', 'o', 'true', '1'], true)) {
            return 'ok';
        }

        $r = mb_strtolower($resultText);
        foreach (['ng', '否', '不成立', '失敗', '却下', '未成約'] as $bad) {
            if ($r !== '' && str_contains($r, mb_strtolower($bad))) {
                return 'ng';
            }
        }
        foreach (['成約', 'ok', '成立', '成功'] as $good) {
            if ($r !== '' && str_contains($r, mb_strtolower($good))) {
                return 'ok';
            }
        }

        return 'ok';
    }

    /**
     * @param  array<int, string>  $header
     * @return array<string, int>
     */
    private function buildHeaderMap(array $header): array
    {
        $map = [];
        foreach ($header as $i => $h) {
            $key = trim((string) $h);
            if ($key !== '') {
                $map[$key] = (int) $i;
            }
        }

        return $map;
    }

    /**
     * @param  array<int, string>  $cols
     * @param  array<string, int>  $map
     * @param  array<int, string>  $candidates
     */
    private function col(array $cols, array $map, array $candidates): string
    {
        foreach ($candidates as $name) {
            if (array_key_exists($name, $map)) {
                $idx = $map[$name];

                return isset($cols[$idx]) ? trim((string) $cols[$idx]) : '';
            }
        }

        return '';
    }

    /**
     * @param  array<int, string>  $header
     * @param  array<int, string>  $cols
     * @return array<string, string>
     */
    private function rawAssoc(array $header, array $cols): array
    {
        $raw = [];
        foreach ($header as $i => $h) {
            $key = trim((string) $h);
            if ($key === '') {
                continue;
            }
            $raw[$key] = isset($cols[$i]) ? (string) $cols[$i] : '';
        }

        return $raw;
    }
}
