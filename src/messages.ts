import type { SettingsFile } from "./types";

// ============================================================================
// 可配置的通知文本 (configurable notification messages)
//
// Every user-facing string the extension shows via `notify` (plus the default
// block/stop reasons returned to pi) lives in DEFAULT_MESSAGES below.
// Override any subset through the top-level `messages` key in settings:
//
//   {
//     "hooks": { ... },
//     "messages": {
//       "preToolUseBlocked": "Blocked: {reason}",
//       "hookError": "Hook crashed: {error}"
//     }
//   }
//
// Templates use `{var}` placeholders. Supported vars per message:
//   reason, output, stderr, error, exitCode, decision.
// Unknown placeholders are left untouched; defaults stay exactly as before
// so existing installs see no behavior change.
// ============================================================================

export type MessageKey =
  | "preToolUseBlocked"
  | "preToolUseDenied"
  | "preToolUsePlainOutput"
  | "preToolUseFailed"
  | "preToolUseError"
  | "postToolUseFeedback"
  | "postToolUseOutput"
  | "postToolUseFailed"
  | "postToolUseError"
  | "postToolUseFailureFeedback"
  | "postToolUseFailureOutput"
  | "postToolUseFailureFailed"
  | "postToolUseFailureError"
  | "userPromptSubmitInvalidDecision"
  | "userPromptSubmitPlainOutput"
  | "userPromptSubmitFailed"
  | "userPromptSubmitError"
  | "userPromptSubmitBlocked"
  | "stopInvalidDecision"
  | "stopPlainOutput"
  | "stopFailed"
  | "stopError"
  | "hookFailed"
  | "hookOutput"
  | "hookError"
  | "defaultBlockedReason"
  | "preToolUseStoppedReason"
  | "stopBlockReason";

export type HookMessages = {
  [K in MessageKey]?: string;
};

export const DEFAULT_MESSAGES: Record<MessageKey, string> = {
  preToolUseBlocked: "PreToolUse 阻止: {reason}",
  preToolUseDenied: "PreToolUse 拒绝: {reason}",
  preToolUsePlainOutput: "PreToolUse 输出 (非JSON): {output}",
  preToolUseFailed: "PreToolUse 失败 (exit {exitCode}): {stderr}",
  preToolUseError: "PreToolUse 执行错误: {error}",
  postToolUseFeedback: "PostToolUse 反馈: {stderr}",
  postToolUseOutput: "PostToolUse 输出: {output}",
  postToolUseFailed: "PostToolUse 失败 (exit {exitCode}): {stderr}",
  postToolUseError: "PostToolUse 执行错误: {error}",
  postToolUseFailureFeedback: "PostToolUseFailure 反馈: {stderr}",
  postToolUseFailureOutput: "PostToolUseFailure 输出: {output}",
  postToolUseFailureFailed: "PostToolUseFailure 失败 (exit {exitCode}): {stderr}",
  postToolUseFailureError: "PostToolUseFailure 执行错误: {error}",
  userPromptSubmitInvalidDecision:
    "UserPromptSubmit 忽略无效 decision: {decision}",
  userPromptSubmitPlainOutput: "UserPromptSubmit 输出 (非JSON): {output}",
  userPromptSubmitFailed: "UserPromptSubmit 失败 (exit {exitCode}): {stderr}",
  userPromptSubmitError: "UserPromptSubmit 执行错误: {error}",
  userPromptSubmitBlocked: "UserPromptSubmit 阻止: {reason}",
  stopInvalidDecision: "Stop 忽略无效 decision: {decision}",
  stopPlainOutput: "Stop 输出 (非JSON): {output}",
  stopFailed: "Stop 失败 (exit {exitCode}): {stderr}",
  stopError: "Stop 执行错误: {error}",
  hookFailed: "Hook 失败 (exit {exitCode}): {stderr}",
  hookOutput: "Hook 输出: {output}",
  hookError: "Hook 执行错误: {error}",
  defaultBlockedReason: "Blocked by hook",
  preToolUseStoppedReason: "Stopped by hook",
  stopBlockReason: "Continue requested by Stop hook",
};

export function resolveMessages(
  settings: SettingsFile | undefined,
): Record<MessageKey, string> {
  return { ...DEFAULT_MESSAGES, ...settings?.messages };
}

export function formatMessage(
  template: string,
  vars: Record<string, string | number | undefined>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined ? match : String(value);
  });
}
