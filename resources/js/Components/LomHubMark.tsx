import { SVGAttributes } from 'react';

/**
 * LOMHub mark (geometric / sci‑fi).
 * - Monochrome (uses currentColor) to match theme.
 * - Designed for 24-40px usage (crisp at small sizes).
 */
export default function LomHubMark(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer frame */}
            <rect x="3" y="3" width="34" height="34" rx="10" stroke="currentColor" strokeWidth="2" opacity="0.9" />

            {/* Hex core */}
            <path
                d="M20 10.5L28 15.2V24.8L20 29.5L12 24.8V15.2L20 10.5Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
                opacity="0.95"
            />

            {/* Orbit */}
            <path
                d="M30 20C30 25.5228 25.5228 30 20 30C14.4772 30 10 25.5228 10 20C10 14.4772 14.4772 10 20 10"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                opacity="0.55"
            />

            {/* Axis line */}
            <path
                d="M13 27L27 13"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                opacity="0.55"
            />

            {/* Nodes */}
            <circle cx="27" cy="13" r="1.6" fill="currentColor" opacity="0.95" />
            <circle cx="13" cy="27" r="1.4" fill="currentColor" opacity="0.75" />
            <circle cx="20" cy="20" r="1.8" fill="currentColor" opacity="0.95" />
        </svg>
    );
}

