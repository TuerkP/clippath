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
      cursor: "grab",
    },
    svg: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
    },
  });

export interface Point {
  unit: string;
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
  onChange: (points: Point[]) => void;
}

interface State {
  active: number;
  img: Dimension;
}

class ClipPathBilder extends Component<Props, State> {
  public readonly state: State = {active: -1, img: {w: 0, h: 0}};

  private imgId: string = getUniqueId();

  public componentDidMount = () => {
    this.updateImageSize();
  };

  private updateImageSize = () => {
    const img = document.getElementById(this.imgId);
    if (img && img.clientHeight && img.clientWidth) {
      this.setState({img: {w: img.clientWidth, h: img.clientHeight}});
    }
  };

  private round = (value: number, fractionDigits = 3) => Number(value.toFixed(fractionDigits));

  private toPercent = (part: number, total: number) => this.round((part / total) * 100);

  private addPoint = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const {points, zoom, onChange} = this.props;
    const {img} = this.state;
    const newPoint: Point = {
      top: this.toPercent(event.nativeEvent.offsetY * zoom, img.h * zoom),
      left: this.toPercent(event.nativeEvent.offsetX * zoom, img.w * zoom),
      unit: "%",
    };
    onChange([...points, newPoint]);
  };

  private grabPoint = (idx: number) => () => {
    this.setState({active: idx});
  };

  private movePoint = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const {points: oldPoints, zoom, onChange} = this.props;
    const {img} = this.state;

    const points = [...oldPoints]; // Kopie von Points erstellen
    const activePoint = points[this.state.active];

    points[this.state.active] = {
      top: this.round(activePoint.top + this.toPercent(event.movementY, img.h * zoom)),
      left: this.round(activePoint.left + this.toPercent(event.movementX, img.w * zoom)),
      unit: "%",
    };
    onChange(points);
  };

  private releasePoint = () => {
    this.setState({active: -1});
  };

  private createLine = (point: Point, idx: number, points: Point[]) => {
    if (points.length < 2) return null;
    const next = idx === points.length - 1 ? points[0] : points[idx + 1];
    const key = `${point.top}x${point.left}_line`;

    const pos = {
      x1: `${point.left}${point.unit}`,
      y1: `${point.top}${point.unit}`,
      x2: `${next.left}${next.unit}`,
      y2: `${next.top}${next.unit}`,
    };

    return <line key={key} {...pos} stroke="white" />;
  };

  private createPoint = (point: Point, idx: number) => {
    const {classes, zoom} = this.props;
    const {active, img} = this.state;
    const key = getUniqueId();

    const radius = 0.5 * (POINT_BOX_SIZE + 4) * zoom;
    const topBoxOffset = this.toPercent(radius, img.h * zoom);
    const leftBoxOffset = this.toPercent(radius, img.w * zoom);

    const style = {
      top: `${point.top - topBoxOffset}${point.unit}`,
      left: `${point.left - leftBoxOffset}${point.unit}`,
      cursor: idx === active ? "grabbing" : "grab",
    };
    return (
      <div key={key} style={style} className={classes.point} onMouseDown={this.grabPoint(idx)} />
    );
  };

  render() {
    const {src, alt, points, zoom, classes} = this.props;
    const {active} = this.state;
    const zoomStyle: CSSProperties = {
      transform: `scale(${zoom})`,
      transformOrigin: "0 0",
    };

    const onMouseUp = active === -1 ? this.addPoint : this.releasePoint;
    const onMouseMove = active > -1 ? this.movePoint : () => false;

    return (
      <div className={classes.scrollContainer}>
        <div
          className={classes.container}
          style={zoomStyle}
          onMouseUp={onMouseUp}
          onMouseMove={onMouseMove}
        >
          <img src={src} alt={alt} className={classes.img} id={this.imgId} />
          <svg className={classes.svg}>{points.map(this.createLine)}</svg>
          {points.map(this.createPoint)}
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(ClipPathBilder);
