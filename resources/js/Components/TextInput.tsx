import {
    forwardRef,
    InputHTMLAttributes,
    useEffect,
    useImperativeHandle,
    useRef,
} from 'react';

export default forwardRef(function TextInput(
    {
        type = 'text',
        className = '',
        isFocused = false,
        ...props
    }: InputHTMLAttributes<HTMLInputElement> & { isFocused?: boolean },
    ref,
) {
    const localRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={
                'rounded-xl border-stone-200 bg-white shadow-sm placeholder:text-stone-400 focus:border-emerald-500 focus:ring-emerald-500 ' +
                'transition-all duration-200 focus:outline-none focus:shadow-[inset_0_0_0_1px_rgba(16,185,129,0.2),inset_0_0_14px_rgba(110,231,183,0.22)] ' +
                className
            }
            ref={localRef}
        />
    );
});
