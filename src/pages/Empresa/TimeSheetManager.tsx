import { Box } from "@chakra-ui/react";
import TimesheetGeneratorPanel from "../../components/Timesheet/TimesheetGeneratorPanel";

const TimeSheetManager = () => {
  return (
    <Box className="animate-fade-in">
      <TimesheetGeneratorPanel />
    </Box>
  );
};

export default TimeSheetManager;
