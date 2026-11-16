import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Info, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { WelcomeCard, SUGGESTED_QUESTIONS } from "@/components/chat/WelcomeCard";
import { MessageBubble, StreamingBubble } from "@/components/chat/MessageBubble";
import { Composer } from "@/components/chat/Composer";
import { SiteParamsPanel } from "@/components/chat/SiteParamsPanel";
import { HistorySheet } from "@/components/chat/HistorySheet";
import { SpecialistDialog } from "@/components/chat/SpecialistDialog";
import { apiGet, apiPost, apiStream, errorMessage } from "@/lib/api";
import type { Conversation, ConversationDetail, StreamDone, StreamEvent } from "@/lib/types";
import { EMPTY_SITE, followUps, missingFields } from "@/lib/site";

interface Pending {
  text: string;
  reply: string;
}

export default function Chat() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [pending, setPending] = useState<Pending | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [paramsOpen, setParamsOpen] = useState(false);
  const [specialistOpen, setSpecialistOpen] = useState(false);
  const [disclaimer, setDisclaimer] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const cidRef = useRef<string | null>(null);

  const convQ = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => apiGet<ConversationDetail>(`/conversations/${id}`),
    enabled: !!id,
    refetchOnWindowFocus: false,
  });
  const conv = id && !convQ.isError ? convQ.data : undefined;
  const isSample = !!conv?.is_sample;
  const messages = conv?.messages ?? [];
  const site = conv?.site ?? EMPTY_SITE;
  const missingCount = missingFields(site).length;

  const send = useMutation({
    mutationFn: async (text: string) => {
      let cid = id && conv && !conv.is_sample ? id : null;
      setPending({ text, reply: "" });
      if (!cid) cid = (await apiPost<Conversation>("/conversations")).id;
      cidRef.current = cid;
      const out: { done?: StreamDone; error?: string } = {};
      await apiStream<StreamEvent>(`/conversations/${cid}/messages`, { text }, (ev) => {
        if (ev.type === "delta") setPending((p) => (p ? { ...p, reply: p.reply + ev.text } : p));
        else if (ev.type === "done") out.done = ev;
        else out.error = ev.detail;
      });
      if (!out.done) throw new Error(out.error ?? "Ответ прервался. Попробуйте ещё раз.");
      return { cid, done: out.done };
    },
    onSuccess: ({ cid, done }) => {
      qc.setQueryData<ConversationDetail>(["conversation", cid], (old) => ({
        ...done.conversation,
        messages: [...(old?.messages ?? []), done.user_message, done.message],
      }));
      qc.invalidateQueries({ queryKey: ["conversations", false] });
      setPending(null);
      if (cid !== id) navigate(`/c/${cid}`);
    },
    onError: (e) => {
      setPending(null);
      toast.error(errorMessage(e, "Не удалось получить ответ ассистента"));
      const cid = cidRef.current;
      if (cid) {
        qc.invalidateQueries({ queryKey: ["conversation", cid] });
        if (cid !== id) navigate(`/c/${cid}`);
      }
    },
  });

  const ask = (text: string) => {
    if (!send.isPending) send.mutate(text);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pending?.reply, pending?.text]);

  const showWelcome = !id && !pending;
  const notFound = !!id && convQ.isError;
  const quickReplies = showWelcome
    ? []
    : isSample
      ? SUGGESTED_QUESTIONS.slice(0, 3)
      : messages.length > 0 && !pending
        ? followUps(site)
        : [];
  const openSpecialist = () => setSpecialistOpen(true);

  return (
    <div className="flex h-dvh flex-col bg-page">
      <ChatHeader
        missingCount={missingCount}
        onHistory={() => setHistoryOpen(true)}
        onParams={() => setParamsOpen(true)}
        onSpecialist={openSpecialist}
      />
      {disclaimer && (
        <div data-testid="disclaimer-bar" className="flex items-start gap-2 bg-sand px-3 py-2 text-[12.5px] leading-snug text-sand-ink sm:px-5">
          <Info className="mt-0.5 size-4 shrink-0" />
          <p className="flex-1">
            <span className="font-semibold">Прототип.</span> Ассистент даёт предварительные консультации и не подключён к
            каталогу, ценам, складу и сайту Florial.
          </p>
          <button type="button" aria-label="Скрыть" onClick={() => setDisclaimer(false)} data-testid="disclaimer-close-button" className="rounded-md p-0.5 transition-colors duration-200 hover:bg-amber-200/60">
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          <div data-testid="chat-message-list" aria-label="chat-message-list" className="flex-1 overflow-y-auto px-3 py-5 sm:px-5">
            <div className="mx-auto max-w-3xl space-y-5">
              {isSample && (
                <div data-testid="sample-banner" className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3">
                  <Eye className="size-4 text-moss" />
                  <p className="min-w-0 flex-1 text-[13px] text-ink-muted">
                    <span className="font-semibold text-ink">Пример консультации</span> — только просмотр. Ваш вопрос
                    начнёт новый диалог.
                  </p>
                  <Link to="/" data-testid="sample-start-own-button" className="rounded-lg bg-sage px-3 py-1.5 text-[13px] font-semibold text-moss transition-colors duration-200 hover:bg-[#d2e8da]">
                    Начать свой диалог
                  </Link>
                </div>
              )}
              {showWelcome && <WelcomeCard onAsk={ask} disabled={send.isPending} />}
              {notFound && (
                <div data-testid="conversation-not-found" className="rounded-2xl border border-line bg-white p-5 text-center">
                  <p className="font-heading text-lg font-semibold text-ink">Диалог недоступен</p>
                  <p className="mt-1 text-sm text-ink-muted">Возможно, он был удалён или сервер временно недоступен.</p>
                  <Link to="/" className="mt-3 inline-block text-sm font-semibold text-moss underline-offset-4 hover:underline">
                    Начать новый диалог
                  </Link>
                </div>
              )}
              {id && convQ.isLoading && (
                <div className="space-y-3">
                  {[0, 1].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-2xl bg-sage/70" />
                  ))}
                </div>
              )}
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} onSpecialist={openSpecialist} />
              ))}
              {pending && (
                <>
                  <MessageBubble
                    message={{
                      id: "pending-user",
                      conversation_id: "",
                      role: "user",
                      content: pending.text,
                      guidance: null,
                      sources: [],
                      created_at: new Date().toISOString(),
                    }}
                    onSpecialist={openSpecialist}
                  />
                  <StreamingBubble text={pending.reply} />
                </>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
          <Composer onSend={ask} disabled={send.isPending} quickReplies={quickReplies} />
        </main>

        <aside className="hidden w-[340px] shrink-0 overflow-y-auto border-l border-line bg-white/70 p-5 lg:block">
          <SiteParamsPanel site={site} onSpecialist={openSpecialist} />
        </aside>
      </div>

      <Sheet open={paramsOpen} onOpenChange={setParamsOpen}>
        <SheetContent side="bottom" data-testid="params-sheet" className="max-h-[85dvh] overflow-y-auto rounded-t-3xl p-5">
          <SheetHeader className="p-0 pb-3">
            <SheetTitle className="font-heading text-lg">Параметры участка</SheetTitle>
            <SheetDescription>Что уже известно и чего не хватает для расчёта</SheetDescription>
          </SheetHeader>
          <SiteParamsPanel
            site={site}
            onSpecialist={() => {
              setParamsOpen(false);
              openSpecialist();
            }}
          />
        </SheetContent>
      </Sheet>
      <HistorySheet open={historyOpen} onOpenChange={setHistoryOpen} activeId={id} />
      <SpecialistDialog
        open={specialistOpen}
        onOpenChange={setSpecialistOpen}
        conversationId={id && !isSample ? id : null}
        site={isSample ? EMPTY_SITE : site}
      />
    </div>
  );
}
