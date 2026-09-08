import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { getHookGroups } from "../config";
import { extractTextFromContent } from "../helpers";
import type { HookModuleContext } from "../hook-context";
import type {
  HookExecutionContext,
  NotifyFn,
  SettingsFile,
  StopResult,
} from "../types";
import { formatMessage, resolveMessages } from "../messages";
import {
  appendAdditionalContext,
  executeParsedHook,
  getStringField,
  hookIfMatches,
} from "./shared";

function findLastAssistantMessageText(messages: unknown[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i] as {
      role?: string;
      content?: unknown;
    };

    if (message?.role === "assistant") {
      return extractTextFromContent(message.content);
    }
  }

  return "";
}

export async function triggerStopHooks(
  context: HookExecutionContext,
  settings: SettingsFile | undefined,
  notify?: NotifyFn,
): Promise<StopResult> {
  const groups = getHookGroups(settings, "Stop");
  const msg = resolveMessages(settings);
  const result: StopResult = { blocked: false };

  for (const group of groups) {
    for (const hook of group.hooks ?? []) {
      if (hook.if && !hookIfMatches(context, hook.if)) continue;

      try {
        const { hookResult, plainStdout, jsonOutput, commonOutput } =
          await executeParsedHook(hook, context, "Stop");

        if (hookResult.exitCode === 0 && jsonOutput) {
          const additionalContext = getStringField(
            commonOutput?.hookSpecificOutput?.additionalContext,
            jsonOutput.additionalContext,
          );

          result.additionalContext = appendAdditionalContext(
            result.additionalContext,
            additionalContext,
          );

          if (commonOutput?.systemMessage) {
            notify?.(commonOutput.systemMessage, "warning");
          }

          if (
            jsonOutput.decision !== undefined &&
            jsonOutput.decision !== "block"
          ) {
            notify?.(
              formatMessage(msg.stopInvalidDecision, {
                decision: String(jsonOutput.decision),
              }),
              "warning",
            );
          }

          if (jsonOutput.decision === "block") {
            result.blocked = true;
            result.reason =
              getStringField(jsonOutput.reason) ?? msg.stopBlockReason;
            return result;
          }
        } else if (hookResult.exitCode === 0 && plainStdout) {
          notify?.(
            formatMessage(msg.stopPlainOutput, { output: plainStdout }),
            "info",
          );
        }

        if (hookResult.exitCode !== 0) {
          notify?.(
            formatMessage(msg.stopFailed, {
              exitCode: hookResult.exitCode,
              stderr: hookResult.stderr,
            }),
            "error",
          );
        }
      } catch (err) {
        notify?.(
          formatMessage(msg.stopError, { error: String(err) }),
          "error",
        );
      }
    }
  }

  return result;
}

export function registerStopHooks(pi: ExtensionAPI, shared: HookModuleContext) {
  pi.on("agent_end", async (event, ctx) => {
    const result = await triggerStopHooks(
      {
        sessionId: shared.getSessionId(ctx),
        cwd: ctx.cwd,
        hookEventName: "Stop",
        transcriptPath: ctx.sessionManager.getSessionFile(),
        stopHookActive: shared.stopHookActive,
        lastAssistantMessage: findLastAssistantMessageText(event.messages),
      },
      shared.currentSettings,
      (msg, type) => shared.notify(ctx, msg, type),
    );

    if (result.blocked) {
      const continuationMessage = [result.reason, result.additionalContext]
        .filter((value): value is string => Boolean(value && value.trim()))
        .join("\n\n");

      shared.stopHookActive = true;
      shared.pi.sendMessage(
        {
          customType: "pi-hooks",
          content: continuationMessage,
          display: false,
          details: {
            hookEventName: "Stop",
            stopHookActive: true,
          },
        },
        {
          deliverAs: "followUp",
          triggerTurn: true,
        },
      );
      return;
    }

    shared.stopHookActive = false;
  });
}
