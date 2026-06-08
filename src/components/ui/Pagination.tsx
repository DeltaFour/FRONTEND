import { type ChangeEvent } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import { useColorModeValue } from "../../theme/colorMode";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const getPageNumbers = (current: number, total: number): number[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: number[] = [];
  const start = Math.max(2, current - 2);
  const end = Math.min(total - 1, current + 2);

  pages.push(1);
  if (start > 2) pages.push(-1); // ellipsis
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push(-2); // ellipsis
  pages.push(total);

  return pages;
};

export const Pagination = ({
  page,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
}: PaginationProps) => {
  const borderColor = useColorModeValue("#E2E8F0", "rgba(255,255,255,0.1)");
  const bg = useColorModeValue("#FFFFFF", "#1A1A1F");
  const color = useColorModeValue("#1A202C", "#E2E8F0");
  const activeBg = useColorModeValue("#6B46C1", "#9F7AEA");
  const activeColor = "#FFFFFF";
  const hoverBg = useColorModeValue("#F7FAFC", "#2D3748");
  const mutedColor = useColorModeValue("#718096", "#A0AEC0");

  const pageNumbers = getPageNumbers(page, totalPages);

  const btnBase = {
    display: "inline-flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    minW: "32px",
    h: "32px",
    px: "8px",
    borderRadius: "6px",
    fontSize: "sm",
    fontWeight: "medium",
    cursor: "pointer",
    border: `1px solid ${borderColor}`,
    background: bg,
    color,
    transition: "background 0.15s",
  };

  const NavBtn = ({
    label,
    onClick,
    disabled,
    bg,
    border,
  }: {
    label: string;
    onClick: () => void;
    disabled: boolean;
    bg?: string;
    border?: string;
  }) => (
    <Box
      as="button"
      type="button"
      onClick={disabled ? undefined : onClick}
      {...btnBase}
      background={bg}
      border={border}
      opacity={disabled ? 0.4 : 1}
      cursor={disabled ? "not-allowed" : "pointer"}
      _hover={disabled ? {} : { background: hoverBg }}
      pointerEvents={disabled ? "none" : "auto"}
    >
      {label}
    </Box>
  );

  return (
    <Flex align="center" justify="space-between" flexWrap="wrap" gap={3} py={3}>
      {/* Left: items per page */}
      <Flex align="center" gap={2} fontSize="sm" color={mutedColor}>
        <Text>Mostrando</Text>
        <Box
          as="select"
          value={pageSize}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            onPageSizeChange(Number(e.target.value))
          }
          style={{
            padding: "4px 8px",
            borderRadius: "6px",
            border: `1px solid ${borderColor}`,
            backgroundColor: bg,
            color,
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          {pageSizeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </Box>
        <Text>resultados por página</Text>
      </Flex>

      {/* Center: page navigation */}
      <Flex align="center" gap={1} flexWrap="wrap">
        <NavBtn label="Início" bg="transparent" border="none" onClick={() => onPageChange(1)} disabled={page <= 1} />
        <NavBtn label="«" onClick={() => onPageChange(page - 1)} disabled={page <= 1} />

        {pageNumbers.map((num, idx) =>
          num < 0 ? (
            <Box key={`ellipsis-${idx}`} px={2} fontSize="sm" color={mutedColor} userSelect="none">
              …
            </Box>
          ) : (
            <Box
              key={num}
              as="button"
              type="button"
              onClick={() => onPageChange(num)}
              {...btnBase}
              background={num === page ? activeBg : bg}
              color={num === page ? activeColor : color}
              borderColor={num === page ? activeBg : borderColor}
              fontWeight={num === page ? "bold" : "medium"}
              _hover={num === page ? {} : { background: hoverBg }}
            >
              {num}
            </Box>
          ),
        )}

        <NavBtn label="»" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} />
        <NavBtn label="Última" bg="transparent" border="none"onClick={() => onPageChange(totalPages)} disabled={page >= totalPages} />
      </Flex>

      {/* Right: total count */}
      <Text fontSize="sm" color={mutedColor} whiteSpace="nowrap">
        Foram encontrados {totalRecords} resultado{totalRecords !== 1 ? "s" : ""}
      </Text>
    </Flex>
  );
};
