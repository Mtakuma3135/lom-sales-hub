<?php

namespace App\Support\Network;

/**
 * §3.1 admin_allowed_ips — IPv4 完全一致または CIDR（カンマ区切り設定は config で解決済み）。
 */
final class AdminIpAllowlist
{
    /**
     * @param  list<string>  $rules
     */
    public static function matches(?string $ip, array $rules): bool
    {
        if ($ip === null || $ip === '' || filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) === false) {
            return false;
        }

        foreach ($rules as $rule) {
            $rule = trim((string) $rule);
            if ($rule === '') {
                continue;
            }
            if (str_contains($rule, '/')) {
                if (self::ipv4InCidr($ip, $rule)) {
                    return true;
                }
            } elseif ($ip === $rule) {
                return true;
            }
        }

        return false;
    }

    private static function ipv4InCidr(string $ip, string $cidr): bool
    {
        $parts = explode('/', $cidr, 2);
        if (count($parts) !== 2) {
            return false;
        }
        [$subnet, $bits] = $parts;
        $bits = (int) $bits;
        if ($bits < 0 || $bits > 32) {
            return false;
        }
        if (filter_var($subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) === false) {
            return false;
        }
        $ipLong = ip2long($ip);
        $subnetLong = ip2long($subnet);
        if ($ipLong === false || $subnetLong === false) {
            return false;
        }
        $mask = $bits === 0 ? 0 : (-1 << (32 - $bits)) & 0xFFFFFFFF;

        return ($ipLong & $mask) === ($subnetLong & $mask);
    }
}
