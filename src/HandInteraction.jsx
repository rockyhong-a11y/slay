import { useEffect, useRef, useState } from "react";
import {
  beginHandGesture,
  cancelHandGesture,
  createHandGesture,
  createHandHitRegions,
  expireHandTap,
  finishHandGesture,
  HAND_DOUBLE_TAP_MS,
  HAND_DRAG_THRESHOLD,
  TOUCH_CONFIRM_MS,
  hitTestHand,
  moveHandGesture,
  unlockHandPlay,
} from "./hand-interaction.js";
import "./touch-feedback.css";

/** Taps follow the visible card; an intentional sweep owns stable baseline rails. */
export function HandInteraction({
  children,
  cards = [],
  selectedId,
  contextKey,
  onSelect,
  onPlay,
  onFeedback,
  getCardLabel,
  getUnplayableReason,
  isPlayable = () => true,
  locked = false,
  className = "",
  style,
}) {
  const element = useRef(null);
  const gesture = useRef(createHandGesture());
  const regions = useRef([]);
  const pressedCard = useRef(null);
  const pointers = useRef(new Set());
  const previouslyLocked = useRef(locked);
  const timers = useRef({ arm: null, commit: null });
  const callbacks = useRef({ onPlay, isPlayable, getUnplayableReason, locked });
  callbacks.current = { onPlay, isPlayable, getUnplayableReason, locked };
  const [dragging, setDragging] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const handKey = cards.map((card) => card.uid).join("|");

  const cardElements = () =>
    [
      ...(element.current?.querySelectorAll("[data-hand-card-id]") || []),
    ].filter((card) => card.getAttribute("aria-hidden") !== "true");
  const labelFor = (uid) =>
    getCardLabel?.(uid) ||
    cardElements()
      .find((card) => card.dataset.handCardId === uid)
      ?.getAttribute("aria-label")
      ?.split(",")[0] ||
    "카드";
  const showFeedback = (uid, stage, detail) => {
    const label = labelFor(uid);
    const next = { uid, stage, label, detail, sequence: performance.now() };
    setFeedback(next);
    onFeedback?.(next);
  };
  const clearTimers = () => {
    clearTimeout(timers.current.arm);
    clearTimeout(timers.current.commit);
    timers.current = { arm: null, commit: null };
  };
  const snapshotRails = () => {
    const host = element.current;
    if (!host) return [];
    const bounds = host.getBoundingClientRect();
    regions.current = createHandHitRegions(
      cardElements().map((card) => {
        const rect = card.getBoundingClientRect();
        return {
          uid: card.dataset.handCardId,
          left: rect.left,
          width: rect.width,
        };
      }),
      { left: bounds.left, right: bounds.right },
    );
    return regions.current;
  };
  const visibleTarget = (x, y) => {
    const bounds = element.current?.getBoundingClientRect();
    if (
      !bounds ||
      x < bounds.left ||
      x > bounds.right ||
      y < bounds.top ||
      y > bounds.bottom
    )
      return null;
    return hitTestHand(regions.current, x, {
      y,
      visibleCards: cardElements().map((card) => {
        const rect = card.getBoundingClientRect();
        return {
          uid: card.dataset.handCardId,
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
          zIndex: Number(getComputedStyle(card).zIndex) || 0,
        };
      }),
    });
  };
  const releaseCapture = (pointerId) => {
    const host = element.current;
    if (host?.hasPointerCapture(pointerId))
      host.releasePointerCapture(pointerId);
  };
  const cancel = () => {
    const pointerId = gesture.current.pointer?.pointerId;
    pressedCard.current = null;
    clearTimers();
    gesture.current = unlockHandPlay(gesture.current);
    setDragging(false);
    setFeedback(null);
    if (pointerId != null) releaseCapture(pointerId);
  };
  const arm = (uid) => {
    clearTimeout(timers.current.arm);
    showFeedback(uid, "armed", "1/2 · 같은 곳을 한 번 더 탭");
    timers.current.arm = setTimeout(() => {
      gesture.current = expireHandTap(gesture.current);
      setFeedback((current) =>
        current?.stage === "armed"
          ? {
              ...current,
              stage: "selected",
              detail: "선택됨 · 두 번 탭해 사용",
            }
          : current,
      );
    }, HAND_DOUBLE_TAP_MS + 1);
  };

  useEffect(() => {
    cancel();
    regions.current = [];
    pointers.current.clear();
  }, [handKey, contextKey]);
  useEffect(() => {
    if (locked) cancel();
    else if (previouslyLocked.current)
      gesture.current = unlockHandPlay(gesture.current);
    previouslyLocked.current = locked;
  }, [locked]);
  useEffect(() => {
    if (feedback && feedback.uid !== selectedId) cancel();
    if (gesture.current.lastTap && gesture.current.lastTap.uid !== selectedId) {
      gesture.current = cancelHandGesture(gesture.current);
      clearTimeout(timers.current.arm);
      setFeedback(null);
    }
  }, [selectedId]);
  useEffect(() => {
    const abort = () => {
      pointers.current.clear();
      cancel();
    };
    const hide = () => {
      if (document.hidden) abort();
    };
    const rejectAdditionalPointer = (event) => {
      if (event.isPrimary === false || !element.current?.contains(event.target))
        abort();
    };
    window.addEventListener("blur", abort);
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pointerdown", rejectAdditionalPointer, true);
    return () => {
      window.removeEventListener("blur", abort);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pointerdown", rejectAdditionalPointer, true);
      clearTimers();
    };
  }, []);

  return (
    <div
      ref={element}
      className={`${className} hand-interaction`}
      style={style}
      role="group"
      aria-label="손패. 드래그로 카드를 선택하고, 같은 카드의 같은 곳을 두 번 탭하면 사용합니다."
      data-hand-selected={selectedId}
      data-hand-dragging={dragging || undefined}
      data-hand-locked={locked || feedback?.stage === "confirmed" || undefined}
      data-touch-stage={feedback?.stage}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        pointers.current.add(event.pointerId);
        if (pointers.current.size > 1 || event.isPrimary === false) {
          event.preventDefault();
          cancel();
          return;
        }
        snapshotRails();
        const uid = visibleTarget(event.clientX, event.clientY);
        const downCard = cardElements().find(
          (card) => card.dataset.handCardId === uid,
        );
        const downRect = downCard?.getBoundingClientRect();
        pressedCard.current = downRect
          ? {
              uid,
              left: downRect.left,
              right: downRect.right,
              top: downRect.top,
              bottom: downRect.bottom,
            }
          : null;
        gesture.current = beginHandGesture(gesture.current, {
          pointerId: event.pointerId,
          uid,
          x: event.clientX,
          y: event.clientY,
          time: event.timeStamp,
          locked,
        });
        if (!gesture.current.pointer) return;
        event.preventDefault();
        element.current?.setPointerCapture(event.pointerId);
        onSelect?.(uid);
        showFeedback(uid, "pressed", "누르는 중");
      }}
      onPointerMove={(event) => {
        if (locked || pointers.current.size > 1) return;
        const pointer = gesture.current.pointer;
        if (pointer?.pointerId !== event.pointerId) return;
        event.preventDefault();
        const sweeping =
          pointer.moved ||
          Math.hypot(
            event.clientX - pointer.startX,
            event.clientY - pointer.startY,
          ) >= HAND_DRAG_THRESHOLD;
        // A stationary tap must never switch to the hidden card's baseline rail.
        const uid = sweeping
          ? hitTestHand(regions.current, event.clientX, { clamp: true })
          : pointer.initialUid;
        gesture.current = moveHandGesture(gesture.current, {
          pointerId: event.pointerId,
          uid,
          x: event.clientX,
          y: event.clientY,
        });
        setDragging(gesture.current.pointer.moved);
        if (sweeping) {
          clearTimeout(timers.current.arm);
          onSelect?.(uid);
          showFeedback(uid, "dragging", "드래그 선택 · 놓은 뒤 두 번 탭");
        }
      }}
      onPointerUp={(event) => {
        pointers.current.delete(event.pointerId);
        if (gesture.current.pointer?.pointerId !== event.pointerId) return;
        event.preventDefault();
        const pointer = gesture.current.pointer;
        const bounds = element.current?.getBoundingClientRect();
        const inside =
          bounds &&
          event.clientX >= bounds.left &&
          event.clientX <= bounds.right &&
          event.clientY >= bounds.top &&
          event.clientY <= bounds.bottom;
        const uid = inside
          ? pointer.moved
            ? hitTestHand(regions.current, event.clientX)
            : hitTestHand(regions.current, event.clientX, {
                y: event.clientY,
                visibleCards: pressedCard.current ? [pressedCard.current] : [],
              })
          : null;
        const result = finishHandGesture(gesture.current, {
          pointerId: event.pointerId,
          uid,
          x: event.clientX,
          y: event.clientY,
          time: event.timeStamp,
          locked,
          playable: !!uid && isPlayable(uid),
        });
        gesture.current = result.state;
        setDragging(false);
        releaseCapture(event.pointerId);
        if (result.select) onSelect?.(result.select);
        if (result.play) {
          clearTimeout(timers.current.arm);
          showFeedback(result.play, "confirmed", "✓ 2/2 · 사용 확정");
          const chosen = result.play;
          timers.current.commit = setTimeout(() => {
            const current = callbacks.current;
            if (current.locked || !current.isPlayable(chosen)) {
              gesture.current = unlockHandPlay(gesture.current);
              showFeedback(
                chosen,
                "blocked",
                current.getUnplayableReason?.(chosen) ||
                  "지금은 사용할 수 없습니다",
              );
              return;
            }
            if (current.onPlay?.(chosen) === false) {
              gesture.current = unlockHandPlay(gesture.current);
              showFeedback(
                chosen,
                "blocked",
                current.getUnplayableReason?.(chosen) ||
                  "지금은 사용할 수 없습니다",
              );
            }
          }, TOUCH_CONFIRM_MS);
        } else if (
          result.blocked ||
          (result.select && !isPlayable(result.select))
        ) {
          showFeedback(
            result.select,
            "blocked",
            getUnplayableReason?.(result.select) || "사용 조건을 확인하세요",
          );
        } else if (result.state.lastTap) arm(result.select);
        else if (result.select)
          showFeedback(result.select, "selected", "선택됨 · 두 번 탭해 사용");
        else setFeedback(null);
      }}
      onPointerCancel={(event) => {
        pointers.current.delete(event.pointerId);
        cancel();
      }}
      onLostPointerCapture={(event) => {
        if (gesture.current.pointer?.pointerId === event.pointerId) cancel();
      }}
      onClickCapture={(event) => {
        if (event.detail > 0) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
      onDoubleClickCapture={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
    >
      {children}
      {feedback && (
        <div
          className={`hand-touch-feedback touch-${feedback.stage}`}
          role="status"
          aria-live="polite"
          key={feedback.sequence}
        >
          <strong>{feedback.label}</strong>
          <span>{feedback.detail}</span>
        </div>
      )}
    </div>
  );
}
