// Interactive SVG board: drag from peg to peg along a lattice line to
// stretch a rubber band. Completed triangles fill with the owner's color.

import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, View } from 'react-native';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';
import { DIRECTIONS, pegKey, pegToXY } from '../../game/board';
import { Match, moveNewEdges } from '../../game/engine';
import { Move, Peg } from '../../game/types';
import { COLORS } from '../theme';

interface Props {
  match: Match;
  size: number; // rendered width in px
  interactive: boolean;
  onMove: (move: Move) => void;
  /** bumped by the parent after every applied move to force re-render */
  version: number;
}

interface XY {
  x: number;
  y: number;
}

export default function BoardView({ match, size, interactive, onMove, version }: Props) {
  const pad = size * 0.06;
  const scale = (size - 2 * pad) / 8; // x spans [-4, 4]
  const height = Math.ceil(8 * (Math.sqrt(3) / 2) * scale + 2 * pad);
  const cx = size / 2;
  const cy = height / 2;

  const toPx = (p: Peg): XY => {
    const u = pegToXY(p);
    return { x: cx + u.x * scale, y: cy + u.y * scale };
  };

  const [drag, setDrag] = useState<{ from: Peg; point: XY; target: Peg | null } | null>(null);
  const dragRef = useRef(drag);
  dragRef.current = drag;

  const pegsPx = useMemo(
    () => match.board.pegs.map((p) => ({ peg: p, px: toPx(p) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [match, size],
  );

  const nearestPeg = (pt: XY, maxDist: number): Peg | null => {
    let best: Peg | null = null;
    let bestD = maxDist * maxDist;
    for (const { peg, px } of pegsPx) {
      const d = (px.x - pt.x) ** 2 + (px.y - pt.y) ** 2;
      if (d < bestD) {
        bestD = d;
        best = peg;
      }
    }
    return best;
  };

  /** Pegs reachable from `from` in a straight line with >=1 fresh edge. */
  const validTargets = (from: Peg): Peg[] => {
    const out: Peg[] = [];
    for (const d of DIRECTIONS) {
      let cur = from;
      for (;;) {
        const next = { q: cur.q + d.q, r: cur.r + d.r };
        if (!match.board.pegSet.has(pegKey(next))) break;
        if (moveNewEdges(match, { from, to: next })) out.push(next);
        cur = next;
      }
    }
    return out;
  };

  const targetsRef = useRef<Peg[]>([]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => interactive,
        onMoveShouldSetPanResponder: () => interactive,
        onPanResponderGrant: (evt) => {
          const pt = { x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY };
          const from = nearestPeg(pt, scale * 0.75);
          if (from) {
            targetsRef.current = validTargets(from);
            setDrag({ from, point: pt, target: null });
          }
        },
        onPanResponderMove: (evt) => {
          const cur = dragRef.current;
          if (!cur) return;
          const pt = { x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY };
          let target: Peg | null = null;
          let bestD = (scale * 0.7) ** 2;
          for (const cand of targetsRef.current) {
            const px = toPx(cand);
            const d = (px.x - pt.x) ** 2 + (px.y - pt.y) ** 2;
            if (d < bestD) {
              bestD = d;
              target = cand;
            }
          }
          setDrag({ from: cur.from, point: pt, target });
        },
        onPanResponderRelease: () => {
          const cur = dragRef.current;
          setDrag(null);
          if (cur?.target) onMove({ from: cur.from, to: cur.target });
        },
        onPanResponderTerminate: () => setDrag(null),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [interactive, match, size, version],
  );

  // Hexagon plate corners (expanded slightly beyond the pegs)
  const plate = useMemo(() => {
    const corners: Peg[] = [
      { q: 4, r: 0 }, { q: 0, r: 4 }, { q: -4, r: 4 },
      { q: -4, r: 0 }, { q: 0, r: -4 }, { q: 4, r: -4 },
    ];
    return corners
      .map((c) => {
        const px = toPx(c);
        const vx = px.x - cx;
        const vy = px.y - cy;
        const len = Math.hypot(vx, vy);
        const grow = (len + scale * 0.55) / len;
        return `${cx + vx * grow},${cy + vy * grow}`;
      })
      .join(' ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size]);

  const bandStroke = scale * 0.22;
  const pegR = scale * 0.17;

  const targetSet = drag ? new Set(targetsRef.current.map(pegKey)) : null;

  return (
    <View style={{ width: size, height }} {...panResponder.panHandlers}>
      <Svg width={size} height={height}>
        {/* board plate */}
        <Polygon points={plate} fill={COLORS.boardFill} stroke="#46527a" strokeWidth={scale * 0.28} strokeLinejoin="round" />

        {/* triangles: claimed fills + bonus crosses */}
        {match.board.triangles.map((tri) => {
          const pts = tri.pegs.map(toPx);
          const owner = match.state.claimedTriangles.get(tri.id);
          const centroid = {
            x: (pts[0].x + pts[1].x + pts[2].x) / 3,
            y: (pts[0].y + pts[1].y + pts[2].y) / 3,
          };
          const bonusColor =
            tri.bonus === 'blue' ? COLORS.bonusBlue : tri.bonus === 'purple' ? COLORS.bonusPurple : '#67739e';
          const s = scale * 0.14;
          return (
            <React.Fragment key={tri.id}>
              <Polygon
                points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
                fill={owner === 0 ? COLORS.playerTri : owner === 1 ? COLORS.opponentTri : 'rgba(255,255,255,0.04)'}
                stroke={COLORS.boardTri}
                strokeWidth={1}
              />
              {owner === undefined && (
                <>
                  <Line x1={centroid.x - s} y1={centroid.y} x2={centroid.x + s} y2={centroid.y}
                    stroke={bonusColor} strokeWidth={s * 0.8} strokeLinecap="round" />
                  <Line x1={centroid.x} y1={centroid.y - s} x2={centroid.x} y2={centroid.y + s}
                    stroke={bonusColor} strokeWidth={s * 0.8} strokeLinecap="round" />
                </>
              )}
            </React.Fragment>
          );
        })}

        {/* placed bands */}
        {match.state.placedBands.map((band, i) => {
          const a = toPx(band.move.from);
          const b = toPx(band.move.to);
          const color = band.player === 0 ? COLORS.player : COLORS.opponent;
          return (
            <React.Fragment key={i}>
              <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(0,0,0,0.25)"
                strokeWidth={bandStroke * 1.35} strokeLinecap="round" />
              <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color}
                strokeWidth={bandStroke} strokeLinecap="round" />
            </React.Fragment>
          );
        })}

        {/* drag preview */}
        {drag && (
          <Line
            x1={toPx(drag.from).x}
            y1={toPx(drag.from).y}
            x2={drag.target ? toPx(drag.target).x : drag.point.x}
            y2={drag.target ? toPx(drag.target).y : drag.point.y}
            stroke={drag.target ? COLORS.pegHighlight : 'rgba(255,255,255,0.7)'}
            strokeWidth={bandStroke * 0.8}
            strokeLinecap="round"
            strokeDasharray={`${scale * 0.25},${scale * 0.18}`}
          />
        )}

        {/* pegs */}
        {pegsPx.map(({ peg, px }) => {
          const isFrom = drag && pegKey(drag.from) === pegKey(peg);
          const isTarget = drag && drag.target && pegKey(drag.target) === pegKey(peg);
          const isValid = targetSet?.has(pegKey(peg));
          return (
            <React.Fragment key={pegKey(peg)}>
              {(isValid || isFrom) && (
                <Circle cx={px.x} cy={px.y} r={pegR * 1.9}
                  fill="none" stroke={COLORS.pegHighlight}
                  strokeWidth={isTarget || isFrom ? 3 : 1.5}
                  opacity={isTarget || isFrom ? 1 : 0.55} />
              )}
              <Circle cx={px.x} cy={px.y + pegR * 0.25} r={pegR} fill="rgba(0,0,0,0.35)" />
              <Circle cx={px.x} cy={px.y} r={pegR} fill={COLORS.peg} />
              <Circle cx={px.x - pegR * 0.3} cy={px.y - pegR * 0.3} r={pegR * 0.35} fill="rgba(255,255,255,0.25)" />
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
