import {createStyles, withStyles, WithStyles} from "@material-ui/core";
import {CSSProperties} from "@material-ui/core/styles/withStyles";
import React, {Component} from "react";
import {POINT_BOX_BORDER, POINT_BOX_SIZE} from "./Constants";

const getUniqueId = () => Math.random().toString(36).substr(2, 9);

const styles = () =>
  createStyles({
    scrollContainer: {
      overflow: "auto",
      border: "1px solid black",
      position: "relative",
    },
    container: {
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
      width: `${POINT_BOX_SIZE}px`,
      height: `${POINT_BOX_SIZE}px`,
      border: `${POINT_BOX_BORDER}px solid green`,
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

interface Dimension {
  w: number;
  h: number;
}

interface Props extends WithStyles<typeof styles> {
  src: string;
  alt: string;
  zoom: number;
  points: Point[];
  hideBoxes: boolean;
  onChange: (points: Point[]) => void;
}

interface State {
  active: number;
  mouseDown: boolean;
  img: Dimension;
}

class ClipPathBuilder extends Component<Props, State> {
  static defaultProps = {hideBoxes: false};
  private activeRef: React.RefObject<HTMLDivElement>;
  private svgPathRef: React.RefObject<SVGPathElement>;
  private imageRef: React.RefObject<HTMLImageElement>;
  private movement = {x: 0, y: 0};

  constructor(props: Props) {
    super(props);
    this.state = {active: -1, mouseDown: false, img: {w: 0, h: 0}};
    this.activeRef = React.createRef<HTMLDivElement>();
    this.svgPathRef = React.createRef<SVGPathElement>();
    this.imageRef = React.createRef<HTMLImageElement>();
  }

  private updateImg = () => {
    const img = this.imageRef.current;
    if (img && img.clientHeight && img.clientWidth) {
      this.setState({img: {w: img.clientWidth, h: img.clientHeight}});
    }
  };

  private round = (value: number, fractionDigits = 3) => Number(value.toFixed(fractionDigits));

  private toPercent = (part: number, total: number) => this.round((part / total) * 100);

  private createActivePoint = (): Point => {
    const {active, img} = this.state;
    const {points, zoom} = this.props;
    return {
      top: this.round(points[active].top + this.toPercent(this.movement.y, img.h * zoom)),
      left: this.round(points[active].left + this.toPercent(this.movement.x, img.w * zoom)),
    };
  };

  private addPoint = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const {points, zoom, onChange} = this.props;
    const {img} = this.state;
    const newPoint: Point = {
      top: this.toPercent(event.nativeEvent.offsetY * zoom, img.h * zoom),
      left: this.toPercent(event.nativeEvent.offsetX * zoom, img.w * zoom),
    };
    onChange([...points, newPoint]);
  };

  private grabPoint = (idx: number) => () => {
    this.setState({active: idx});
  };

  private movePoint = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (this.activeRef.current) {
      const {zoom} = this.props;
      const x = this.movement.x + event.movementX;
      const y = this.movement.y + event.movementY;
      this.movement = {x, y};

      this.activeRef.current.style.transform = `scale(${1 / zoom})
                                                translate3d(${x}px, ${y}px, 0px)`;
      if (this.svgPathRef.current) {
        const d = this.svgPathRef.current.attributes.getNamedItem("d");
        if (d) {
          d.value = this.createPathCommands(this.createActivePoint());
        }
      }
    }
  };

  private releasePoint = () => {
    const {onChange} = this.props;
    const {active} = this.state;

    if (active !== -1) {
      const points = [...this.props.points]; // Kopie von Points erstellen
      points[active] = this.createActivePoint();
      onChange(points);
      this.setState({active: -1, mouseDown: false});
      this.movement = {x: 0, y: 0};
    }
  };

  private createPoint = (point: Point, idx: number) => {
    const {classes, zoom, hideBoxes} = this.props;
    const {active, img} = this.state;
    const key = getUniqueId();

    const radius = 0.5 * (POINT_BOX_SIZE + 2 * POINT_BOX_BORDER) * zoom;
    const topBoxOffset = this.toPercent(radius, img.h * zoom);
    const leftBoxOffset = this.toPercent(radius, img.w * zoom);

    const style = {
      top: `${point.top - topBoxOffset}%`,
      left: `${point.left - leftBoxOffset}%`,
      cursor: idx === active ? "grabbing" : "grab",
      display: hideBoxes || (active > -1 && idx !== active) ? "none" : "block",
      transform: `scale(${1 / zoom})`,
    };
    const ref = active === idx ? {ref: this.activeRef} : {};
    return (
      <div
        key={key}
        {...ref}
        style={style}
        className={classes.point}
        onMouseDown={this.grabPoint(idx)}
      />
    );
  };

  /**
   * Erstellt das Pfadkommando (d) für einen Pfad eines SVG. Eine Beschreibung findet sich hier:
   * https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d
   */
  private createPathCommands = (activePoint?: Point) => {
    const {active} = this.state;
    const points = this.props.points.map((p, idx) => (idx === active ? activePoint ?? p : p));

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

  private onMouseDown = () => {
    this.setState({mouseDown: true});
  };

  private onMouseUp = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const {active, mouseDown} = this.state;
    if (active === -1 && mouseDown) {
      this.addPoint(event);
      this.setState({mouseDown: false});
    } else {
      this.releasePoint();
    }
  };

  private onMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) =>
    this.state.active > -1 ? this.movePoint(event) : () => false;

  private onMouseLeave = () => {
    this.releasePoint();
  };

  render() {
    const {src, alt, points, zoom, classes} = this.props;
    const zoomStyle: CSSProperties = {
      transform: `scale(${zoom})`,
      transformOrigin: "0 0",
    };

    return (
      <div className={classes.scrollContainer}>
        <div
          className={classes.container}
          style={zoomStyle}
          onMouseUp={this.onMouseUp}
          onMouseDown={this.onMouseDown}
          onMouseLeave={this.onMouseLeave}
          onMouseMove={this.onMouseMove}
        >
          <img
            src={src}
            alt={alt}
            ref={this.imageRef}
            className={classes.img}
            onLoad={this.updateImg}
          />
          <svg className={classes.svg} viewBox="0 0 100 100" preserveAspectRatio="none">
            <path ref={this.svgPathRef} className={classes.path} d={this.createPathCommands()} />
          </svg>
          {points.map(this.createPoint)}
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(ClipPathBuilder);
