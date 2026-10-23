import type { TrendPoint } from '@/types';

export function WellbeingChart({
    data,
    metric = 'mood',
    height = 190,
}: {
    data: TrendPoint[];
    metric?: 'mood' | 'energy';
    height?: number;
}) {
    const width = 560;
    const top = 15;
    const bottom = 145;
    const left = 28;
    const right = 540;
    const color = metric === 'mood' ? '#c17f67' : '#6e9072';
    const fill = metric === 'mood' ? '#f2e4dc' : '#e2ece0';
    const points = data.map((item, index) => ({
        ...item,
        value: item[metric],
        x:
            data.length <= 1
                ? (left + right) / 2
                : left + (index * (right - left)) / (data.length - 1),
    }));
    const y = (value: number) => bottom - ((value - 1) / 9) * (bottom - top);
    let path = '';
    points.forEach((point) => {
        if (point.value === null) return;
        path += `${path.endsWith('L') || path === '' || path.endsWith('M') ? '' : ' '}${path === '' || points[points.indexOf(point) - 1]?.value === null ? 'M' : 'L'} ${point.x} ${y(point.value)} `;
    });
    const valid = points.filter((point) => point.value !== null);
    const area =
        valid.length > 1
            ? `${valid.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${y(point.value as number)}`).join(' ')} L ${valid[valid.length - 1].x} ${bottom} L ${valid[0].x} ${bottom} Z`
            : '';

    if (valid.length === 0) {
        return (
            <div className="flex h-[190px] items-center justify-center text-sm text-[#929d94]">
                Check-in trends will appear here.
            </div>
        );
    }

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full overflow-visible"
            role="img"
            aria-label={`Seven day ${metric} trend`}
        >
            {[10, 5, 1].map((tick) => (
                <g key={tick}>
                    <line
                        x1={left}
                        x2={right}
                        y1={y(tick)}
                        y2={y(tick)}
                        stroke="#e9ece6"
                        strokeWidth="1"
                        strokeDasharray={tick === 5 ? '3 5' : undefined}
                    />
                    <text x="3" y={y(tick) + 3} fontSize="9" fill="#a0a9a1">
                        {tick}
                    </text>
                </g>
            ))}
            {area && <path d={area} fill={fill} opacity=".55" />}
            <path
                d={path.trim()}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {points.map(
                (point) =>
                    point.value !== null && (
                        <g key={point.date}>
                            <circle
                                cx={point.x}
                                cy={y(point.value)}
                                r="7"
                                fill={color}
                                opacity=".09"
                            />
                            <circle
                                cx={point.x}
                                cy={y(point.value)}
                                r="3.2"
                                fill="white"
                                stroke={color}
                                strokeWidth="2"
                            >
                                <title>
                                    {point.label}: {point.value}/10
                                </title>
                            </circle>
                        </g>
                    ),
            )}
            {points.map((point) => (
                <text
                    key={`label-${point.date}`}
                    x={point.x}
                    y="174"
                    textAnchor="middle"
                    fontSize="10"
                    fill="#929c94"
                >
                    {point.label}
                </text>
            ))}
        </svg>
    );
}
