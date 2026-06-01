"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { deleteDeal } from "@/app/(internal)/deals/actions";
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

export function DeleteDealButton({
  dealId,
  dealName,
}: {
  dealId: string;
  dealName: string;
}) {
  const [pending, startTransition] = useTransition();

  function onDelete() {
    startTransition(async () => {
      const res = await deleteDeal(dealId);
      // 成功時は redirect されるため、ここに来るのはエラー時のみ
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
          <DialogTitle>案件を削除しますか？</DialogTitle>
          <DialogDescription>
            「{dealName}」を削除します。関連する担当者・進捗履歴も削除され、
            この操作は取り消せません。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            キャンセル
          </DialogClose>
          <Button
            variant="destructive"
            onClick={onDelete}
            disabled={pending}
          >
            {pending ? "削除中…" : "削除する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
