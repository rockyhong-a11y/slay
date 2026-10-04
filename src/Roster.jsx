import React, { useState } from "react";
import {
  ArrowRight,
  CaretDown,
  Check,
  Heart,
  Eye,
  Sparkle,
} from "@phosphor-icons/react";
import { WRESTLERS, getCard } from "./game.js";
import { fighterPoseArt } from "./presentation.js";
import { Artwork } from "./Artwork.jsx";

function deckGroups(deck) {
  return Object.entries(
    deck.reduce((counts, id) => {
      counts[id] = (counts[id] || 0) + 1;
      return counts;
    }, {}),
  );
}

export function Roster({ currentId, onStart, onPreview }) {
  const [role, setRole] = useState("all");
  const fighters = Object.entries(WRESTLERS);
  const visible = fighters.filter(([, fighter]) =>
    role === "all" ? true : fighter.role === role,
  );
  const roles = [...new Set(fighters.map(([, fighter]) => fighter.role))];

  return (
    <div className="fighter-roster">
      <div className="roster-intro">
        <p>
          {fighters.length}명의 선수, 서로 다른 경기 운영. 역할과 패시브를
          비교하고 나의 링 스타일을 선택하세요.
        </p>
      </div>
      <div
        className="roster-role-controls"
        role="group"
        aria-label="선수 역할 필터"
      >
        <button
          type="button"
          aria-pressed={role === "all"}
          onClick={() => setRole("all")}
        >
          전체 선수 <span>{fighters.length}</span>
        </button>
        {roles.map((item) => (
          <button
            type="button"
            key={item}
            aria-pressed={role === item}
            onClick={() => setRole(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <p className="roster-run-note">
        상태 미리보기로 표정과 자세를 확인할 수 있습니다. 새 런을 시작하면 현재
        진행이 선택한 선수의 시작 덱으로 바뀝니다.
      </p>
      <div className="contender-grid">
        {visible.map(([id, fighter]) => (
          <article
            className="contender-card"
            key={id}
            aria-labelledby={`contender-${id}`}
            style={{ "--contender-accent": fighter.accent }}
          >
            <div className="contender-stage">
              <span className="contender-number" aria-hidden="true">
                {String(fighters.findIndex(([key]) => key === id) + 1).padStart(
                  2,
                  "0",
                )}
              </span>
              {currentId === id && (
                <span className="contender-current">
                  <Check size={12} weight="bold" /> 현재 선수
                </span>
              )}
              <Artwork
                art={fighterPoseArt(id)}
                alt={`${fighter.nameKo} · ${fighter.role}`}
                position={[0.5, 1]}
              />
              <span className="contender-role-en">{fighter.roleEn}</span>
            </div>
            <div className="contender-copy">
              <div className="contender-name-row">
                <div>
                  <span className="contender-title">{fighter.title}</span>
                  <h3 id={`contender-${id}`}>{fighter.name}</h3>
                  <span className="contender-name-ko">{fighter.nameKo}</span>
                </div>
                <span
                  className="contender-health"
                  aria-label={`최대 체력 ${fighter.maxHp}`}
                >
                  <Heart size={14} weight="fill" />
                  <strong>{fighter.maxHp}</strong>
                  <small>HP</small>
                </span>
              </div>
              <div className="contender-role-row">
                <strong>{fighter.role}</strong>
                <span className="contender-complexity">
                  <span aria-hidden="true">
                    {[1, 2, 3].map((level) => (
                      <i
                        key={level}
                        className={level <= fighter.complexity ? "filled" : ""}
                      />
                    ))}
                  </span>
                  {fighter.complexityLabel}
                </span>
              </div>
              <p className="contender-strategy">{fighter.strategy}</p>
              <dl className="contender-passive">
                <dt>
                  <Sparkle size={13} weight="fill" /> 고유 패시브
                </dt>
                <dd>{fighter.passive}</dd>
              </dl>
              <ul
                className="contender-strengths"
                aria-label={`${fighter.nameKo}의 강점`}
              >
                {fighter.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <details className="contender-details">
                <summary>
                  전략과 시작 덱 <CaretDown size={14} />
                </summary>
                <p className="contender-easy-label">{fighter.easyLabel}</p>
                <ol>
                  {fighter.playstyle.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ol>
                <h4>시작 덱 · {fighter.startingDeck.length}장</h4>
                <ul className="contender-card-list">
                  {deckGroups(fighter.startingDeck).map(([cardId, count]) => (
                    <li key={cardId}>
                      <span>{getCard(cardId).name}</span>
                      <b>×{count}</b>
                    </li>
                  ))}
                </ul>
                <h4>함께 쓰면 좋은 카드</h4>
                <ul className="contender-recommendations">
                  {fighter.recommendedCards.map((cardId) => (
                    <li key={cardId}>{getCard(cardId).name}</li>
                  ))}
                </ul>
              </details>
              <div className="contender-actions">
                <button
                  type="button"
                  className="contender-preview-button"
                  onClick={() => onPreview(id)}
                  aria-label={`${fighter.nameKo}의 상태별 표정과 자세 미리보기`}
                >
                  <Eye size={18} /> 상태 미리보기
                </button>
                <button
                  type="button"
                  className="primary-button contender-start-button"
                  onClick={() => onStart(id)}
                  aria-label={`${fighter.nameKo}로 새 런 시작`}
                >
                  이 선수로 시작 <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
