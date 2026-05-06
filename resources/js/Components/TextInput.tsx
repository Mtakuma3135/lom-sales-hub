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
                'rounded-sm border border-wa-accent/25 bg-wa-ink px-3 py-2 text-sm text-wa-body shadow-none placeholder:text-wa-muted focus:border-wa-accent/45 focus:outline-none focus:ring-1 focus:ring-wa-accent/30 ' +
                className
            }
            ref={localRef}
        />
    );
});
