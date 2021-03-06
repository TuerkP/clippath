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
  editor: {
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

interface ImageInfo {
  width: number;
  height: number;
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

  const activePoint = useRef() as React.MutableRefObject<HTMLDivElement>;
  const svgPath = useRef() as React.MutableRefObject<SVGPathElement>;
  const image = useRef() as React.MutableRefObject<HTMLImageElement>;
  const editor = useRef() as React.MutableRefObject<HTMLDivElement>;

  let movement = {x: 0, y: 0};

  const [activeIdx, setActiveIdx] = useState(-1);
  const [mouseDown, setMouseDown] = useState(false);
  const [imageInfo, setImgInfo] = useState<ImageInfo>({width: 0, height: 0});
  const [menuData, setMenuData] = useState<PointContextMenuData | undefined>();

  const updateImgInfo = () => {
    if (image.current && image.current.clientHeight && image.current.clientWidth) {
      setImgInfo({width: image.current.clientWidth, height: image.current.clientHeight});
    }
  };

  const showMenu = (pointIdx: number) => (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    event.preventDefault();
    const rect = editor.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    setMenuData({position: {x, y}, pointIdx: pointIdx});
  };

  const hideMenu = () => setMenuData(undefined);

  const createActivePoint = (): Point => ({
    top: round(props.points[activeIdx].top + toPercent(movement.y, imageInfo.height * props.zoom)),
    left: round(props.points[activeIdx].left + toPercent(movement.x, imageInfo.width * props.zoom)),
  });

  const addPoint = (posX: number, posY: number) => {
    const newPoint: Point = {
      top: toPercent(posY * props.zoom, imageInfo.height * props.zoom),
      left: toPercent(posX * props.zoom, imageInfo.width * props.zoom),
    };
    props.onChange([...props.points, newPoint]);
  };

  const grabPoint = (idx: number) => () => setActiveIdx(idx);

  const movePoint = (moveX: number, moveY: number) => {
    if (activePoint.current) {
      const {zoom} = props;
      const x = movement.x + moveX;
      const y = movement.y + moveY;
      movement = {x, y};

      activePoint.current.style.transform = `scale(${1 / zoom}) translate3d(${x}px, ${y}px, 0px)`;
      if (svgPath.current) {
        const d = svgPath.current.attributes.getNamedItem("d");
        if (d) {
          d.value = createPathCommands(createActivePoint());
        }
      }
    }
  };

  const releasePoint = () => {
    if (activeIdx !== -1) {
      const points = [...props.points]; // Kopie von Points erstellen
      points[activeIdx] = createActivePoint();
      props.onChange(points);
      setActiveIdx(-1);
      setMouseDown(false);
      movement = {x: 0, y: 0};
    }
  };

  const createPoint = (point: Point, idx: number) => {
    const {zoom} = props;
    const key = getUniqueId();

    const radius = 0.5 * (POINT_BOX_SIZE + 2 * POINT_BOX_BORDER) * zoom;
    const topBoxOffset = toPercent(radius, imageInfo.height * zoom);
    const leftBoxOffset = toPercent(radius, imageInfo.width * zoom);

    const color = idx === 0 || idx === points.length - 1 ? "red" : "white";

    const style = {
      borderColor: `${color}`,
      top: `${point.top - topBoxOffset}%`,
      left: `${point.left - leftBoxOffset}%`,
      cursor: idx === activeIdx ? "grabbing" : "grab",
      display: activeIdx > -1 && idx !== activeIdx ? "none" : "block",
      transform: `scale(${1 / zoom})`,
    };
    const ref = activeIdx === idx ? {ref: activePoint} : {};
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
    const points = props.points.map((p, idx) => (idx === activeIdx ? activePoint ?? p : p));

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
    if (activeIdx === -1 && mouseDown && event.button == 0 && menuData === undefined) {
      addPoint(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
      setMouseDown(false);
    } else {
      releasePoint();
    }
  };

  const onMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
    activeIdx > -1 ? movePoint(event.movementX, event.movementY) : () => false;

  const {src, alt, points, zoom} = props;
  const zoomStyle: CSSProperties = {
    transform: `scale(${zoom})`,
    transformOrigin: "0 0",
  };

  return (
    <div className={classes.scrollContainer}>
      <div
        ref={editor}
        className={classes.editor}
        style={zoomStyle}
        onMouseUp={onMouseUp}
        onMouseDown={() => setMouseDown(true)}
        onMouseLeave={releasePoint}
        onMouseMove={onMouseMove}
      >
        <img src={src} alt={alt} ref={image} className={classes.img} onLoad={updateImgInfo} />
        <svg className={classes.svg} viewBox="0 0 100 100" preserveAspectRatio="none">
          <path ref={svgPath} className={classes.path} d={createPathCommands()} />
        </svg>
        {points.map(createPoint)}
      </div>
      {menuData && (
        <Menu relativePosition={menuData.position} onClose={hideMenu}>
          <MenuItem icon={<PlayArrowIcon />} onClick={setStartPoint}>
            Start
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
