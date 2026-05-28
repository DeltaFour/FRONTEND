import { Box, Button, Flex, Text } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import { useColorModeValue } from "../../theme/colorMode";

interface SignaturePadProps {
  label: string;
  value?: string;
  onChange: (dataUrl: string) => void;
  disabled?: boolean;
  helperText?: string;
  height?: number;
}

const SignaturePad = ({
  label,
  value,
  onChange,
  disabled = false,
  helperText,
  height = 160,
}: SignaturePadProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const strokeColor = useColorModeValue("#1A202C", "#E2E8F0");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.200");
  const bg = useColorModeValue("white", "whiteAlpha.50");

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth;
    canvas.width = width * ratio;
    canvas.height = height * ratio;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = strokeColor;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const drawImage = (src: string) => {
    const canvas = canvasRef.current;
    if (!canvas || !src) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const image = new Image();
    image.onload = () => {
      clearCanvas();
      ctx.drawImage(image, 0, 0, canvas.offsetWidth, height);
    };
    image.src = src;
  };

  useEffect(() => {
    resizeCanvas();
    const handler = () => resizeCanvas();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [height, strokeColor]);

  useEffect(() => {
    if (value) {
      drawImage(value);
    } else {
      clearCanvas();
    }
  }, [value]);

  const getPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    canvas.setPointerCapture(event.pointerId);
    const point = getPoint(event);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
    isDrawingRef.current = true;
    lastPointRef.current = point;
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || disabled) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const point = getPoint(event);
    const lastPoint = lastPointRef.current;
    if (!lastPoint) return;

    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
  };

  const endDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;

    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL("image/png"));
  };

  const handleClear = () => {
    clearCanvas();
    onChange("");
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={2}>
        <Text fontSize="sm" fontWeight="semibold" color="fg">
          {label}
        </Text>
        <Button
          size="xs"
          variant="outline"
          borderRadius="full"
          onClick={handleClear}
          disabled={disabled}
        >
          Limpar
        </Button>
      </Flex>

      <Box
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
        bg={bg}
        overflow="hidden"
        opacity={disabled ? 0.6 : 1}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            height,
            touchAction: "none",
            cursor: disabled ? "not-allowed" : "crosshair",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrawing}
          onPointerLeave={endDrawing}
        />
      </Box>

      {helperText ? (
        <Text mt={2} fontSize="xs" color="fg.muted">
          {helperText}
        </Text>
      ) : null}
    </Box>
  );
};

export default SignaturePad;
