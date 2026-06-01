import { redirect } from "next/navigation";

export default function Home() {
  // 認証状態は middleware が判定し、未ログインなら /login へ飛ばす。
  redirect("/dashboard");
}
