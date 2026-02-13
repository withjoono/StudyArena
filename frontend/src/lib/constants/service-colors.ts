// StudyArena 앱 색상 정의
// 다른 앱과 동일한 패턴으로 중앙 관리

export const studyarena = {
    primary: "arena-500",          // #a40606 - 메인 색상 (선명한 크림슨 레드)
    light: "arena-100",            // 밝은 배경
    bg: "from-arena-500 to-arena-600", // 그라디언트
    text: "text-arena-500",
    border: "border-arena-200",
    hover: "hover:bg-arena-600",
    ring: "ring-arena-500",
};

// 용도별 색상 매핑
// | 용도          | 색상                                  | Hex 코드  |
// |---------------|---------------------------------------|----------|
// | Primary       | arena-500                             | #a40606  |
// | Gradient      | from-arena-500 to-arena-600           | -        |
// | Light BG      | arena-100                             | -        |
// | Very Light    | arena-50                              | -        |
// | Border        | arena-200, arena-400                  | -        |
// | Dark Text     | arena-700                             | -        |
// | Hover         | arena-600                             | -        |
// | Accent Text   | arena-100 (on dark bg)                | -        |

// 인라인 스타일용 (동적 색상)
export const primaryColor = "#a40606"; // arena-500
// style={{ color: primaryColor }}
// style={{ backgroundColor: `${primaryColor}15` }} // 투명도 15%
