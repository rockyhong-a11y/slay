import React from "react";
import { Check, LockKey, Trophy } from "@phosphor-icons/react";
import { Artwork } from "./Artwork.jsx";
import { CHAMPIONSHIP_BELTS, getEarnedBelts } from "./championship-belts.js";
import { WRESTLERS } from "./game.js";
import "./wrestling-equipment.css";

export function EquipmentArt({ definition, className = "" }) {
  if (!definition?.artKey) return null;
  return (
    <Artwork
      art={definition.artKey}
      alt={definition.name}
      className={`equipment-art ${className}`}
    />
  );
}

export function BeltAward({ belt, compact = false }) {
  if (!belt) return null;
  return (
    <section
      className={`belt-award ${compact ? "belt-award-compact" : ""}`}
      aria-label={`${belt.name} 획득`}
      style={{ "--belt-color": belt.color }}
    >
      <span className="belt-award-kicker">
        <Trophy size={14} weight="fill" /> TITLE EARNED
      </span>
      <EquipmentArt definition={belt} />
      <div>
        <strong>{belt.name}</strong>
        <span>
          <Check size={13} /> {belt.tier} · {belt.boss} 제압
        </span>
      </div>
    </section>
  );
}

export function ChampionshipCollection({ state, result, onRetry }) {
  const earned = new Map(
    (result?.collection?.belts || []).map((belt) => [belt.id, belt]),
  );
  for (const belt of getEarnedBelts(state))
    if (!earned.has(belt.id)) earned.set(belt.id, belt);
  return (
    <section className="belt-collection" aria-label="챔피언 벨트 보관함">
      <div className="journey-section-heading">
        <h3>
          <Trophy size={18} /> 챔피언 벨트
        </h3>
        <span>{earned.size} / 3 획득</span>
      </div>
      <p>
        각 웨이브의 보스를 제압하면 수여됩니다. 새 아레나를 시작해도 이
        브라우저에 보관되는 우승 기록입니다.
      </p>
      {!result?.ok && (
        <div className="belt-storage-error" role="status">
          <span>
            {result?.message || "벨트 보관함을 확인하지 못했습니다."} 현재 런의
            획득 기록은 유지됩니다.
          </span>
          <button type="button" onClick={onRetry}>
            저장 다시 시도
          </button>
        </div>
      )}
      <div className="belt-collection-grid">
        {CHAMPIONSHIP_BELTS.map((belt) => {
          const record = earned.get(belt.id);
          return (
            <article
              key={belt.id}
              className={record ? "belt-owned" : "belt-locked"}
              style={{ "--belt-color": belt.color }}
            >
              <span className="belt-tier">
                WAVE 0{belt.wave} / {belt.tier}
              </span>
              <EquipmentArt definition={belt} />
              <h4>{belt.name}</h4>
              <p>
                {record
                  ? `${WRESTLERS[record.actorId]?.nameKo || "챔피언"} · ${belt.boss} 제압`
                  : `${belt.boss}를 제압해 획득`}
              </p>
              <span className="belt-status">
                {record ? <Check size={14} /> : <LockKey size={14} />}
                {record ? "획득 완료" : "아직 획득하지 않음"}
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
