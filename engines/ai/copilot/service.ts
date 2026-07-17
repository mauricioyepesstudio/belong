import { runCopilotProvider } from "./provider";
import type { CopilotRunInput, CopilotRunResult, CopilotService } from "./types";

export class BelongCopilotService implements CopilotService {
  async run(input: CopilotRunInput): Promise<CopilotRunResult> {
    return runCopilotProvider(input);
  }
}

export const copilotService = new BelongCopilotService();
