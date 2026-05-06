import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            colors: {
                /** モダン和風（墨黒 / 銅アクセント）— Dashboard・案件KPI などで使用 */
                wa: {
                    ink: '#0f0f0f',
                    card: '#1e1e1e',
                    accent: '#C08457',
                    subtle: '#2c2c2c',
                    body: '#d6d3d1',
                    muted: '#a8a29e',
                },
            },
            fontFamily: {
                /** 和モダン: 欧文 Inter × 本文 Noto Sans JP */
                sans: ['Inter', 'Noto Sans JP', 'ui-sans-serif', 'system-ui', ...defaultTheme.fontFamily.sans],
            },
            boxShadow: {
                nordic: '0 8px 30px rgb(28 25 23 / 0.04)',
                'nordic-hover': '0 12px 36px rgb(28 25 23 / 0.07)',
            },
        },
    },

    plugins: [forms],
};
