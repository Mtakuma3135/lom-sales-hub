import { motion } from 'framer-motion';

/**
 * 数値・文字列の更新時にスロットのように縦スライドで切り替わる演出
 */
export default function SlotNumber({
    value,
    className = '',
}: {
    value: string | number;
    className?: string;
}) {
    const display = typeof value === 'number' && !Number.isInteger(value) ? value.toFixed(1) : String(value);

    return (
        <span className={`inline-block overflow-hidden tabular-nums ${className}`}>
            <motion.span
                key={display}
                initial={{ y: 18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block"
            >
                {display}
            </motion.span>
        </span>
    );
}
