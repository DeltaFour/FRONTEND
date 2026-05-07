import { Input as ChakraInput, type InputProps } from "@chakra-ui/react";

const defaultInputProps: InputProps = {
	color: "gray.700",
	p: "10px",
};

export const Input = (props: InputProps) => {
	return <ChakraInput {...defaultInputProps} {...props} />;
};

export type { InputProps };
