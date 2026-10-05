import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Coins,
  Stack,
  Trophy,
  Trash,
  Scissors,
} from "@phosphor-icons/react";
import { getCard, WRESTLERS } from "./game.js";
import { getCardDetail } from "./card-library.js";
import { Artwork } from "./Artwork.jsx";
import { fighterPoseArt } from "./presentation.js";
import { getDecksForWrestler, MAX_SAVED_DECKS } from "./deck-archive.js";
import "./deck-builder.css";

function groupCards(cards) {
  const groups = new Map();
  for (const card of cards) {
    const key = `${card.id}:${!!card.upgraded}:${card.upgradePath || ""}`;
    const group = groups.get(key);
    if (group) group.count++;
    else groups.set(key, { ...card, count: 1, key });
  }
  return [...groups.values()];
}

export function DeckContents({ cards }) {
  return (
    <div className="blueprint-cards" aria-label="선택한 덱의 카드 목록">
      {groupCards(cards).map((entry) => {
        const card = getCard(entry),
          detail = getCardDetail(entry);
        return (
          <div className="blueprint-card" key={entry.key}>
            <Artwork art={detail.art} alt="" fit="cover" loading="lazy" />
            <span className="blueprint-cost" aria-label={`에너지 ${card.cost}`}>
              {card.cost}
            </span>
            <div>
              <strong>
                {card.name}
                {card.upgradeLabel ? ` · ${card.upgradeLabel}` : ""}
              </strong>
              <p>{card.description}</p>
            </div>
            <b aria-label={`${entry.count}장`}>×{entry.count}</b>
          </div>
        );
      })}
    </div>
  );
}

export function DeckLoadout({
  actorId,
  archive,
  onStart,
  onRoster,
  onDelete,
  error,
}) {
  const [selectedId, setSelectedId] = useState("starter");
  const [deleteIntent, setDeleteIntent] = useState(null);
  const actor = WRESTLERS[actorId];
  const saved = getDecksForWrestler(archive, actorId);
  const selected = saved.find((deck) => deck.id === selectedId);
  const cards =
    selected?.cards ||
    actor.startingDeck.map((id) => ({ id, upgraded: false }));
  const choose = (id) => {
    setSelectedId(id);
    setDeleteIntent(null);
  };
  return (
    <div className="deck-loadout">
      <div className="loadout-player">
        <Artwork art={fighterPoseArt(actorId)} alt={actor.nameKo} />
        <div>
          <span className="eyebrow">01 PLAYER / 02 DECK</span>
          <h3>{actor.name}</h3>
          <p>
            {actor.nameKo} · {actor.role}
          </p>
          <small>{actor.passive}</small>
          <button className="text-button" onClick={onRoster}>
            <ArrowLeft size={15} /> 선수 다시 선택
          </button>
        </div>
      </div>
      <p className="loadout-note">
        클리어한 덱의 카드와 선택한 강화 분기를 그대로 가져옵니다.
        체력·크레딧·아이템은 새 런의 시작 상태로 돌아갑니다.
      </p>
      {error && (
        <p className="builder-error" role="alert">
          {error}
        </p>
      )}
      <div
        className="loadout-options"
        role="group"
        aria-label="아레나 진입 덱 선택"
      >
        <button
          className={!selected ? "selected" : ""}
          aria-pressed={!selected}
          onClick={() => choose("starter")}
        >
          <Stack size={22} />
          <span>
            <strong>기본 시작 덱</strong>
            <small>
              {actor.startingDeck.length}장 · {actor.nameKo}의 기본 구성
            </small>
          </span>
          {!selected && <Check size={20} />}
        </button>
        {saved.map((deck) => (
          <button
            key={deck.id}
            className={selected?.id === deck.id ? "selected" : ""}
            aria-pressed={selected?.id === deck.id}
            onClick={() => choose(deck.id)}
          >
            <Trophy size={22} />
            <span>
              <strong>{deck.name}</strong>
              <small>
                {deck.cards.length}장 · 강화{" "}
                {deck.cards.filter((c) => c.upgraded).length}장 ·{" "}
                {new Date(deck.savedAt).toLocaleDateString("ko-KR")}
              </small>
            </span>
            {selected?.id === deck.id && <Check size={20} />}
          </button>
        ))}
      </div>
      {saved.length === 0 && (
        <p className="builder-empty">
          이 선수의 완성 덱이 아직 없습니다. 최종 보스에게 승리한 뒤 저장할 수
          있습니다.
        </p>
      )}
      <div className="builder-section-heading">
        <h3>{selected?.name || "기본 시작 덱"}</h3>
        <span>{cards.length} CARDS</span>
      </div>
      <DeckContents cards={cards} />
      {selected && (
        <div className="archive-delete">
          {deleteIntent === selected.id ? (
            <>
              <span>
                보관된 덱을 삭제할까요? 현재 런에는 영향을 주지 않습니다.
              </span>
              <button
                onClick={() => {
                  if (onDelete(selected.id)) choose("starter");
                }}
              >
                이 덱 삭제
              </button>
              <button onClick={() => setDeleteIntent(null)}>취소</button>
            </>
          ) : (
            <button onClick={() => setDeleteIntent(selected.id)}>
              <Trash size={15} /> 보관함에서 삭제
            </button>
          )}
        </div>
      )}
      <div className="builder-footer">
        <p>
          진입하면 현재 런이 새 경기로 바뀝니다.
          <br />
          완성 덱 보관함 {archive.decks.length}/{MAX_SAVED_DECKS} · 이
          브라우저에 저장
        </p>
        <button
          className="primary-button"
          onClick={() => onStart(actorId, selected || null)}
        >
          이 덱으로 아레나 진입 <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

export function SaveChampionDeck({ state, existing, onSave, error }) {
  const actor = WRESTLERS[state.player.id];
  const [name, setName] = useState(`${actor.nameKo} 챔피언 덱`);
  return (
    <div className="save-champion-deck">
      <div className="champion-save-summary">
        <Trophy size={34} />
        <div>
          <strong>{actor.nameKo} · 챔피언십 클리어</strong>
          <p>
            {state.deck.length}장 / 강화{" "}
            {state.deck.filter((c) => c.upgraded).length}장 /{" "}
            {state.stats.enemiesDefeated}승
          </p>
        </div>
      </div>
      <p className="loadout-note">
        저장한 덱은 다음 아레나 진입 때 같은 선수로 선택할 수 있습니다. 카드의
        종류·장수·강화를 모두 보존합니다.
      </p>
      <label className="deck-name-field">
        덱 이름
        <input
          value={name}
          maxLength={48}
          onChange={(event) => setName(event.target.value)}
          placeholder="완성 덱의 이름"
        />
      </label>
      {error && (
        <p className="builder-error" role="alert">
          {error}
        </p>
      )}
      <DeckContents cards={state.deck} />
      <div className="builder-footer">
        <p>이 브라우저의 완성 덱 보관함에 저장합니다.</p>
        <button
          className="primary-button"
          disabled={!name.trim() || !!existing}
          onClick={() => onSave(name.trim())}
        >
          {existing ? (
            <>
              <Check size={18} /> 저장된 클리어 덱
            </>
          ) : (
            <>
              <Trophy size={18} /> 완성 덱 저장
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function CardRemovalAction({ offer, onOpen }) {
  if (!offer) return null;
  return (
    <button
      className="card-removal-offer"
      disabled={!offer.available}
      onClick={onOpen}
    >
      <Scissors size={23} />
      <span>
        <strong>카드 영구 제거</strong>
        <small>{offer.available ? offer.description : offer.reason}</small>
      </span>
      <b>
        {offer.remaining === 0 ? (
          "이용 완료"
        ) : offer.cost ? (
          <>
            <Coins size={14} /> {offer.cost}
          </>
        ) : (
          "선택 1회"
        )}
      </b>
    </button>
  );
}

export function CardRemovalPicker({ state, offer, onRemove, onCancel }) {
  const [selectedId, setSelectedId] = useState(null);
  const selected = state.deck.find((card) => card.uid === selectedId);
  const selectedCard = selected && getCard(selected);
  return (
    <div className="card-removal-picker">
      <p className="loadout-note">
        덱에서 제외할 카드 한 장을 선택하세요. 같은 카드가 여러 장이어도 선택한
        한 장만 제거합니다. 덱에는 최소 {offer?.minDeckSize || 5}장이 남아야
        합니다.
      </p>
      <div
        className="removal-card-list"
        role="group"
        aria-label="영구 제거할 카드 선택"
      >
        {state.deck.map((entry, index) => {
          const card = getCard(entry),
            detail = getCardDetail(entry);
          return (
            <button
              key={entry.uid}
              className={selectedId === entry.uid ? "selected" : ""}
              aria-pressed={selectedId === entry.uid}
              onClick={() => setSelectedId(entry.uid)}
              aria-label={`${index + 1}번 ${card.name} 제거 대상으로 선택`}
            >
              <Artwork art={detail.art} alt="" fit="cover" loading="lazy" />
              <span>
                <strong>{card.name}</strong>
                <small>
                  {detail.discipline} · 에너지 {card.cost} ·{" "}
                  {card.upgradeLabel || (entry.upgraded ? "강화" : "기본")}
                </small>
              </span>
              <Check size={18} />
            </button>
          );
        })}
      </div>
      <div className="removal-selection" aria-live="polite">
        <strong>{selectedCard?.name || "제거할 카드를 선택하세요"}</strong>
        <p>
          {selectedCard?.description ||
            "확인 전에는 카드와 크레딧이 소모되지 않습니다."}
        </p>
      </div>
      <div className="builder-footer">
        <p>
          {offer?.cost
            ? `${offer.cost} 크레딧 · 상점마다 1회`
            : "이 장소의 다른 선택을 대신합니다."}
          <br />
          제거 후 {state.deck.length - 1}장
        </p>
        <div>
          <button className="secondary-button" onClick={onCancel}>
            취소
          </button>
          <button
            className="primary-button"
            disabled={!selected || !offer?.available}
            onClick={() => onRemove(selected.uid)}
          >
            <Scissors size={17} /> 선택 카드 영구 제거
          </button>
        </div>
      </div>
    </div>
  );
}
