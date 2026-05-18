import { Input as ChakraInput, type InputProps } from "@chakra-ui/react";
import { useColorModeValue } from "../../theme/colorMode";

export const Input = (props: InputProps) => {
  const bg = "surface";
  const borderColor = "border";
  const color = "fg";
  const placeholderColor = "fg.muted";
  const focusBorder = useColorModeValue("purple.500", "purple.300");

  return (
    <ChakraInput
      p="10px"
      bg={bg}
      borderColor={borderColor}
      color={color}
      _focusVisible={{ borderColor: focusBorder }}
      _placeholder={{ color: placeholderColor }}
      {...props}
    />
  );
};

export type { InputProps };
