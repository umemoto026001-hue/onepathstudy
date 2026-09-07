import { Resend } from "resend";

// RESEND_API_KEY が未設定の環境（ローカル開発など）では、送信をスキップして
// コンソールにログを出すだけにする。メール通知は付加機能であり、
// これが原因でタスク・相談の登録自体が失敗してはいけない。
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Resend はドメイン未認証の場合 onboarding@resend.dev からのみ送信できる。
// 独自ドメイン（例: notify@onepathstudy.com）を認証したら、
// RESEND_FROM_EMAIL 環境変数で上書きできるようにしてある。
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "One Path Study <onboarding@resend.dev>";

export async function sendNotificationEmail({
  to,
  subject,
  text,
}: {
  to: string | null | undefined;
  subject: string;
  text: string;
}) {
  if (!to) return;

  if (!resend) {
    console.log(`[email:skip] RESEND_API_KEY未設定のため送信スキップ -> ${to}: ${subject}`);
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      text,
    });
  } catch (error) {
    // 通知メール送信の失敗でタスク/相談の登録自体を失敗させないよう、
    // ログに残すだけで例外は投げない。
    console.error("[email:error] 通知メール送信に失敗しました", error);
  }
}
