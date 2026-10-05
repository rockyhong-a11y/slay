import React from "react";
import {
  ArrowRight,
  Check,
  Crown,
  Heart,
  Brain,
  Coins,
} from "@phosphor-icons/react";
import { getWaveInfo, WAVES } from "./game.js";
import { Artwork } from "./Artwork.jsx";
import { fighterPoseArt } from "./presentation.js";

export function WaveClearPanel({ state, onContinue }) {
  const wave = getWaveInfo(state);
  const next = wave.nextWave;
  return (
    <section className="wave-clear-panel" aria-labelledby="wave-clear-title">
      <div className="wave-clear-copy">
        <span className="eyebrow">
          WAVE {wave.wave} / {wave.total} COMPLETE
        </span>
        <h2 id="wave-clear-title">
          다음 왕관을 향해.
          <br />
          <span>{wave.difficulty} 웨이브 클리어</span>
        </h2>
        <p>
          {wave.bossName}을 제압했습니다. 완성 중인 덱과 선택한 강화 분기를
          가지고 더 강한 상대에게 도전하세요.
        </p>
        <ol className="wave-ladder" aria-label="아레나 3웨이브 진행">
          {WAVES.map((stage, index) => (
            <li
              className={
                index + 1 <= wave.wave
                  ? "cleared"
                  : index + 1 === wave.wave + 1
                    ? "next"
                    : ""
              }
              key={index}
            >
              <b>
                {index + 1 <= wave.wave ? <Check size={18} /> : `0${index + 1}`}
              </b>
              <span>
                <strong>{stage.difficulty}</strong>
                <small>{stage.name}</small>
              </span>
              {index + 1 === wave.wave + 1 && <em>NEXT</em>}
            </li>
          ))}
        </ol>
        <div className="wave-recovery">
          <span>
            <Heart size={17} /> 체력 최대 +{wave.recovery.heal}
          </span>
          <span>
            <Brain size={17} /> 압박 −{wave.recovery.calm}
          </span>
          <span>
            <Coins size={17} /> 크레딧 {state.player.coins} 유지
          </span>
        </div>
        <p className="wave-carry-note">
          현재 덱 {state.deck.length}장 · 강화{" "}
          {state.deck.filter((card) => card.upgraded).length}장 · 소모품{" "}
          {state.inventory.length}개를 이어갑니다.
        </p>
        <button className="primary-button" onClick={onContinue}>
          웨이브 {wave.wave + 1} · {next?.difficulty} 진입{" "}
          <ArrowRight size={19} />
        </button>
      </div>
      <div className="next-boss-preview">
        <span className="eyebrow">YOUR NEXT BOSS</span>
        <Artwork
          art={fighterPoseArt(next?.bossArtKey || "ember")}
          alt={`${next?.bossName} · 다음 웨이브 보스`}
        />
        <div>
          <Crown size={23} />
          <h3>{next?.bossName}</h3>
          <p>{next?.bossTitle}</p>
          <span>더 강한 공격 · 새로운 행동 순서</span>
        </div>
      </div>
    </section>
  );
}
