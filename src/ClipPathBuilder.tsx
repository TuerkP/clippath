import {makeStyles} from "@material-ui/core";
import {CSSProperties} from "@material-ui/core/styles/withStyles";
import DeleteIcon from "@material-ui/icons/Delete";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import React, {useRef, useState} from "react";
import {POINT_BOX_BORDER, POINT_BOX_SIZE} from "./Constants";
import Menu, {MenuItem} from "./Menu";

const round = (value: number, fractionDigits = 3) => Number(value.toFixed(fractionDigits));

const toPercent = (part: number, total: number) => round((part / total) * 100);

const getUniqueId = () => Math.random().toString(36).substr(2, 9);

const useStyles = makeStyles({
  scrollContainer: {
    overflow: "auto",
    border: "1px solid black",
    position: "relative",
  },
  container: {
    display: "relative",
    cursor: "crosshair",
    width: "fit-content",
    height: "fit-content",
    position: "relative",
  },
  img: {
    display: "block",
  },
  point: {
    position: "absolute",
    border: `${POINT_BOX_BORDER}px solid`,
    width: `${POINT_BOX_SIZE}px`,
    height: `${POINT_BOX_SIZE}px`,
    borderRadius: "50%",
    cursor: "grab",
  },
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  path: {
    fill: "none",
    stroke: "white",
    strokeWidth: "0.1",
  },
});

export interface Point {
  top: number;
  left: number;
}

interface Position {
  x: number;
  y: number;
}

interface PointContextMenuData {
  position: Position;
  pointIdx: number;
}

interface Props {
  src: string;
  alt: string;
  zoom: number;
  points: Point[];
  onChange: (points: Point[]) => void;
}

function ClipPathBuilder(props: Props) {
  const classes = useStyles();

  const activeRef = useRef() as React.MutableRefObject<HTMLDivElement>;
  const svgPathRef = useRef() as React.MutableRefObject<SVGPathElement>;
  const imageRef = useRef() as React.MutableRefObject<HTMLImageElement>;
  const containerRef = useRef() as React.MutableRefObject<HTMLDivElement>;

  let movement = {x: 0, y: 0};

  const [active, setActive] = useState(-1);
  const [mouseDown, setMouseDown] = useState(false);
  const [img, setImg] = useState({w: 0, h: 0});
  const [menuData, setMenuData] = useState<PointContextMenuData | undefined>();

  const updateImg = () => {
    const img = imageRef.current;
    if (img && img.clientHeight && img.clientWidth) {
      setImg({w: img.clientWidth, h: img.clientHeight});
    }
  };

  const showMenu = (pointIdx: number) => (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setMenuData({position: {x, y}, pointIdx: pointIdx});
  };

  const hideMenu = () => setMenuData(undefined);

  const createActivePoint = (): Point => ({
    top: round(props.points[active].top + toPercent(movement.y, img.h * props.zoom)),
    left: round(props.points[active].left + toPercent(movement.x, img.w * props.zoom)),
  });

  const addPoint = (posX: number, posY: number) => {
    const newPoint: Point = {
      top: toPercent(posY * props.zoom, img.h * props.zoom),
      left: toPercent(posX * props.zoom, img.w * props.zoom),
    };
    props.onChange([...props.points, newPoint]);
  };

  const grabPoint = (idx: number) => () => setActive(idx);

  const movePoint = (moveX: number, moveY: number) => {
    if (activeRef.current) {
      const {zoom} = props;
      const x = movement.x + moveX;
      const y = movement.y + moveY;
      movement = {x, y};

      activeRef.current.style.transform = `scale(${1 / zoom}) translate3d(${x}px, ${y}px, 0px)`;
      if (svgPathRef.current) {
        const d = svgPathRef.current.attributes.getNamedItem("d");
        if (d) {
          d.value = createPathCommands(createActivePoint());
        }
      }
    }
  };

  const releasePoint = () => {
    if (active !== -1) {
      const points = [...props.points]; // Kopie von Points erstellen
      points[active] = createActivePoint();
      props.onChange(points);
      setActive(-1);
      setMouseDown(false);
      movement = {x: 0, y: 0};
    }
  };

  const createPoint = (point: Point, idx: number) => {
    const {zoom} = props;
    const key = getUniqueId();

    const radius = 0.5 * (POINT_BOX_SIZE + 2 * POINT_BOX_BORDER) * zoom;
    const topBoxOffset = toPercent(radius, img.h * zoom);
    const leftBoxOffset = toPercent(radius, img.w * zoom);

    let color = "white";
    if (idx === 0) {
      color = "green";
    } else if (idx === points.length - 1) {
      color = "red";
    }

    const style = {
      borderColor: `${color}`,
      top: `${point.top - topBoxOffset}%`,
      left: `${point.left - leftBoxOffset}%`,
      cursor: idx === active ? "grabbing" : "grab",
      display: active > -1 && idx !== active ? "none" : "block",
      transform: `scale(${1 / zoom})`,
    };
    const ref = active === idx ? {ref: activeRef} : {};
    return (
      <div
        key={key}
        {...ref}
        style={style}
        className={classes.point}
        onMouseDown={grabPoint(idx)}
        onContextMenu={showMenu(idx)}
      />
    );
  };

  const deletePoint = () =>
    props.onChange(props.points.filter((__, idx) => idx !== menuData?.pointIdx));

  const setStartPoint = () => {
    if (menuData !== undefined && menuData.pointIdx !== props.points.length - 1) {
      const points = props.points
        .slice(menuData.pointIdx + 1, props.points.length)
        .concat(props.points.slice(0, menuData.pointIdx + 1));
      props.onChange(points);
    }
  };

  /**
   * Erstellt das Pfadkommando (d) für einen Pfad eines SVG. Eine Beschreibung findet sich hier:
   * https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d
   */
  const createPathCommands = (activePoint?: Point) => {
    const points = props.points.map((p, idx) => (idx === active ? activePoint ?? p : p));

    if (points.length > 1) {
      const d = [
        `M ${points[0].left}, ${points[0].top}`, // M: Startpunkt setzen
        ...points.map((p) => `L ${p.left},${p.top}`), // L: Punkte verbinden
        "z", // z: Endpunkt mit Startpunkt verbinden
      ];
      return d.join(" ");
    }
    return "";
  };

  const onMouseUp = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    // event.button == 0     --> left mouse button
    // menuIdx == undefined  --> keinen Punkt erstellen wenn Kontextmenü weggeklickt wird
    if (active === -1 && mouseDown && event.button == 0 && menuData === undefined) {
      addPoint(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
      setMouseDown(false);
    } else {
      releasePoint();
    }
  };

  const onMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
    active > -1 ? movePoint(event.movementX, event.movementY) : () => false;

  const {src, alt, points, zoom} = props;
  const zoomStyle: CSSProperties = {
    transform: `scale(${zoom})`,
    transformOrigin: "0 0",
  };

  return (
    <div className={classes.scrollContainer}>
      <div
        ref={containerRef}
        className={classes.container}
        style={zoomStyle}
        onMouseUp={onMouseUp}
        onMouseDown={() => setMouseDown(true)}
        onMouseLeave={releasePoint}
        onMouseMove={onMouseMove}
      >
        <img src={src} alt={alt} ref={imageRef} className={classes.img} onLoad={updateImg} />
        <svg className={classes.svg} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path ref={svgPathRef} className={classes.path} d={createPathCommands()} />
        </svg>
        {points.map(createPoint)}
      </div>
      {menuData && (
        <Menu relativePosition={menuData.position} onClose={hideMenu}>
          <MenuItem icon={<PlayArrowIcon />} onClick={setStartPoint}>
            Endpunkt
          </MenuItem>
          <MenuItem icon={<DeleteIcon />} onClick={deletePoint}>
            Löschen
          </MenuItem>
        </Menu>
      )}
    </div>
  );
}

export default ClipPathBuilder;
