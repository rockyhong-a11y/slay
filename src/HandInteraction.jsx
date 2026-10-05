import { useEffect, useRef, useState } from "react";
import {
  beginHandGesture,
  cancelHandGesture,
  createHandGesture,
  createHandHitRegions,
  finishHandGesture,
  hitTestHand,
  moveHandGesture,
  unlockHandPlay,
} from "./hand-interaction.js";

/** The pointer owns stable rails while the selected illustration rises above them. */
export function HandInteraction({
  children,
  cards = [],
  selectedId,
  onSelect,
  onPlay,
  isPlayable = () => true,
  locked = false,
  className = "",
  style,
}) {
  const element = useRef(null);
  const gesture = useRef(createHandGesture());
  const regions = useRef([]);
  const pointers = useRef(new Set());
  const previouslyLocked = useRef(locked);
  const [dragging, setDragging] = useState(false);
  const handKey = cards.map((card) => card.uid).join("|");

  const snapshotRails = () => {
    const host = element.current;
    if (!host) return [];
    const bounds = host.getBoundingClientRect();
    regions.current = createHandHitRegions(
      [...host.querySelectorAll("[data-hand-card-id]")]
        .filter((card) => card.getAttribute("aria-hidden") !== "true")
        .map((card) => {
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

  const releaseCapture = (pointerId) => {
    const host = element.current;
    if (host?.hasPointerCapture(pointerId)) {
      host.releasePointerCapture(pointerId);
    }
  };

  const cancel = () => {
    const pointerId = gesture.current.pointer?.pointerId;
    gesture.current = cancelHandGesture(gesture.current);
    setDragging(false);
    if (pointerId != null) releaseCapture(pointerId);
  };

  useEffect(() => {
    gesture.current = unlockHandPlay(gesture.current);
    regions.current = [];
    pointers.current.clear();
    setDragging(false);
  }, [handKey]);

  useEffect(() => {
    if (locked) cancel();
    else if (previouslyLocked.current) {
      gesture.current = unlockHandPlay(gesture.current);
    }
    previouslyLocked.current = locked;
  }, [locked]);

  return (
    <div
      ref={element}
      className={`${className} hand-interaction`}
      style={style}
      role="group"
      aria-label="손패. 드래그로 카드를 선택하고, 같은 카드를 두 번 탭하면 사용합니다."
      data-hand-selected={selectedId}
      data-hand-dragging={dragging || undefined}
      data-hand-locked={locked || undefined}
      onPointerEnter={() => {
        if (!gesture.current.pointer) snapshotRails();
      }}
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        pointers.current.add(event.pointerId);
        if (pointers.current.size > 1) {
          event.preventDefault();
          cancel();
          return;
        }
        snapshotRails();
        const uid = hitTestHand(regions.current, event.clientX);
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
      }}
      onPointerMove={(event) => {
        if (locked || pointers.current.size > 1) return;
        const pointer = gesture.current.pointer;
        if (pointer?.pointerId === event.pointerId) {
          event.preventDefault();
          const uid = hitTestHand(regions.current, event.clientX, {
            clamp: true,
          });
          gesture.current = moveHandGesture(gesture.current, {
            pointerId: event.pointerId,
            uid,
            x: event.clientX,
            y: event.clientY,
          });
          setDragging(gesture.current.pointer.moved);
          onSelect?.(uid);
        } else if (event.pointerType === "mouse" && event.buttons === 0) {
          if (!regions.current.length) snapshotRails();
          const uid = hitTestHand(regions.current, event.clientX);
          if (uid) onSelect?.(uid);
        }
      }}
      onPointerUp={(event) => {
        pointers.current.delete(event.pointerId);
        if (gesture.current.pointer?.pointerId !== event.pointerId) return;
        event.preventDefault();
        const uid = hitTestHand(regions.current, event.clientX, {
          clamp: true,
        });
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
          const accepted = onPlay?.(result.play);
          if (accepted === false) {
            gesture.current = unlockHandPlay(gesture.current);
          }
        }
      }}
      onPointerCancel={(event) => {
        pointers.current.delete(event.pointerId);
        cancel();
      }}
      onLostPointerCapture={(event) => {
        if (gesture.current.pointer?.pointerId === event.pointerId) cancel();
      }}
      onPointerLeave={() => {
        if (!gesture.current.pointer) regions.current = [];
      }}
      onClickCapture={(event) => {
        // Pointer-up already selected/played; keep only native keyboard clicks.
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
    </div>
  );
}
