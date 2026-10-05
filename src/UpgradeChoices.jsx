import React, { useEffect, useId, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Coins,
  Lightning,
  Sparkle,
} from "@phosphor-icons/react";
import { getCard, getCardUpgradeOptions } from "./game.js";
import { Artwork } from "./Artwork.jsx";
import "./upgrade-choices.css";

/** Selection is a preview; only the explicit confirm button applies training. */
export function UpgradeChoices({
  instance,
  onChoose,
  onBack,
  contextLabel = "기술 트레이닝",
  cost = 0,
}) {
  const titleId = useId();
  const [selected, setSelected] = useState(null);
  const [committed, setCommitted] = useState(false);
  useEffect(() => {
    setSelected(null);
    setCommitted(false);
  }, [instance?.uid, instance?.id]);
  const original = getCard(instance);
  const choices = getCardUpgradeOptions(instance);
  const chosen = choices.find((entry) => entry.id === selected);
  if (!original) return null;
  return (
    <section className="upgrade-choices" aria-labelledby={titleId}>
      <header className="upgrade-choices-heading">
        <button type="button" className="upgrade-back" onClick={onBack}>
          <ArrowLeft size={17} />
          카드 다시 선택
        </button>
        <span>{contextLabel}</span>
        <h2 id={titleId}>
          {original.name}
          <em>강화 방향 선택</em>
        </h2>
        <p>
          {choices.length === 3
            ? "3가지 특화 중 하나를 선택하세요. 미리 본 뒤 확정하면 이 카드 한 장에 영구 적용됩니다."
            : "효과를 확인한 뒤 이 카드 한 장의 강화를 확정하세요."}
        </p>
      </header>
      <div className="upgrade-original">
        <Artwork
          art={`cards/${original.id}.webp`}
          alt={`${original.name} 기술`}
          fit="cover"
        />
        <div>
          <span>
            현재 기술 · <Lightning size={13} />
            {original.cost}
          </span>
          <p>{original.description}</p>
        </div>
      </div>
      <div className="upgrade-path-grid" role="group" aria-label="강화 방향">
        {choices.map((choice, index) => (
          <button
            key={choice.id}
            type="button"
            className={`upgrade-path upgrade-path-${choice.id}`}
            aria-pressed={selected === choice.id}
            onClick={() => setSelected(choice.id)}
          >
            <span className="upgrade-path-top">
              <span>PATH 0{index + 1}</span>
              <span className="upgrade-path-cost">
                <Lightning size={15} />
                {choice.cost}
                {choice.cost !== original.cost && (
                  <small>← {original.cost}</small>
                )}
              </span>
            </span>
            <strong>{choice.label}</strong>
            <em>{choice.focus}</em>
            <p>{choice.description}</p>
            <span className="upgrade-path-selected">
              {selected === choice.id ? (
                <>
                  <Check size={17} weight="bold" />
                  선택됨 · 아래에서 확정
                </>
              ) : (
                <>
                  <Sparkle size={16} />이 방향 미리 선택
                </>
              )}
            </span>
          </button>
        ))}
      </div>
      <footer className="upgrade-confirmation">
        <div role="status" aria-live="polite">
          <strong>
            {chosen ? `${chosen.label} 선택됨` : "강화 방향을 선택하세요"}
          </strong>
          <span>
            {cost > 0 ? (
              <>
                <Coins size={15} />
                {cost} 크레딧 · 확정할 때 지불
              </>
            ) : (
              "라커룸 행동 1회 · 확정할 때 소모"
            )}
          </span>
        </div>
        <button
          type="button"
          className="primary-button"
          disabled={!chosen || committed}
          onClick={() => {
            if (chosen && !committed) {
              setCommitted(true);
              if (onChoose(chosen.id) === false) setCommitted(false);
            }
          }}
        >
          <Sparkle size={18} />
          {committed ? "강화 적용 중" : "이 방향으로 강화"}
          <ArrowRight size={18} />
        </button>
      </footer>
    </section>
  );
}
