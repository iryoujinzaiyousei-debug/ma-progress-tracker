"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteBuyer } from "@/app/(internal)/buyers/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

export function DeleteBuyerButton({
  buyerId,
  name,
}: {
  buyerId: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const res = await deleteBuyer(buyerId);
      if (res?.error) toast.error(`削除に失敗しました：${res.error}`);
    });
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          />
        }
      >
        削除
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>買い顧客を削除しますか？</DialogTitle>
          <DialogDescription>
            「{name}」の登録情報・買いニーズを削除します。この操作は取り消せません。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            キャンセル
          </DialogClose>
          <Button variant="destructive" onClick={onDelete} disabled={pending}>
            {pending ? "削除中…" : "削除する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
