import {Button, createStyles, withStyles, WithStyles} from "@material-ui/core";
import {CSSProperties} from "@material-ui/core/styles/withStyles";
import React, {Component} from "react";
import {POINT_BOX_BORDER, POINT_BOX_SIZE} from "./Constants";

const styles = () =>
  createStyles({
    root: {
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
    },
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
    buttonContainer: {
      display: "flex",
      justifyContent: "center",
      marginTop: "10px",
    },
    button: {
      marginRight: "10px",
      "&:last-child": {
        marginRight: "0px",
      },
    },
  });

interface Point {
  unit: string;
  top: number;
  left: number;
}

interface Props extends WithStyles<typeof styles> {
  src: string;
  alt: string;
  points?: Point[];
  onSave?: (points: Point[]) => void;
}

interface Dimension {
  w: number;
  h: number;
}

interface State {
  points: Point[];
  active: number;
  zoom: number;
  img: Dimension;
}

class ClipPathBilder extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {points: props.points ?? [], active: -1, zoom: 1, img: {w: 0, h: 0}};
  }

  public componentDidMount = () => {
    const img = this.getImageSize();
    this.setState({img});
  };

  private getImageSize = (): Dimension => {
    // TODO: IMAGE als ID ist doof
    const img = document.getElementById("IMAGE");
    if (img && img.clientHeight && img.clientWidth) {
      return {w: img.clientWidth, h: img.clientHeight};
    }
    return {w: 0, h: 0};
  };

  private round = (value: number, fractionDigits = 3) => Number(value.toFixed(fractionDigits));

  private toPercent = (part: number, total: number) => this.round((part / total) * 100);

  private addPoint = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const {img, zoom} = this.state;
    const newPoint: Point = {
      top: this.toPercent(event.nativeEvent.offsetY * zoom, img.h * zoom),
      left: this.toPercent(event.nativeEvent.offsetX * zoom, img.w * zoom),
      unit: "%",
    };
    this.setState({points: [...this.state.points, newPoint]});
  };

  private grabPoint = (idx: number) => () => {
    this.setState({active: idx});
  };

  private movePoint = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const {zoom, img} = this.state;
    const points = [...this.state.points]; // Kopie von Points erstellen
    const activePoint = points[this.state.active];

    points[this.state.active] = {
      top: this.round(activePoint.top + this.toPercent(event.movementY, img.h * zoom)),
      left: this.round(activePoint.left + this.toPercent(event.movementX, img.w * zoom)),
      unit: "%",
    };
    this.setState({points});
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
    const {classes} = this.props;
    const {active, zoom, img} = this.state;
    const key = `${point.top}x${point.left}_box`;

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

  private onSave = () => {
    const {onSave} = this.props;
    console.log(this.state.points.map((p) => `${p.top}${p.unit} ${p.left}${p.unit}`).join(", "));
    if (onSave !== undefined) {
      onSave(this.state.points);
    }
  };

  private onDelete = () => {
    this.setState({points: []});
  };

  private onZoomIn = () => this.setState({zoom: this.state.zoom + 0.1});

  private onZoomOut = () => this.setState({zoom: this.state.zoom - 0.1});

  private onZoomReset = () => this.setState({zoom: 1});

  render() {
    const {src, alt, classes} = this.props;
    const {points, active, zoom} = this.state;
    const zoomStyle: CSSProperties = {
      transform: `scale(${zoom})`,
      transformOrigin: "0 0",
    };

    return (
      <div className={classes.root}>
        <div className={classes.scrollContainer}>
          <div
            className={classes.container}
            style={zoomStyle}
            onMouseUp={active === -1 ? this.addPoint : this.releasePoint}
            onMouseMove={active > -1 ? this.movePoint : () => false}
          >
            <img src={src} alt={alt} className={classes.img} id="IMAGE" />
            <svg className={classes.svg}>{points.map(this.createLine)}</svg>
            {points.map(this.createPoint)}
          </div>
        </div>
        <div>
          <div className={classes.buttonContainer}>
            <Button className={classes.button} variant="outlined" onClick={this.onSave}>
              Speichern
            </Button>
            <Button className={classes.button} variant="outlined" onClick={this.onDelete}>
              Löschen
            </Button>
          </div>
          <div className={classes.buttonContainer}>
            <Button className={classes.button} variant="outlined" onClick={this.onZoomIn}>
              +
            </Button>
            <Button className={classes.button} variant="outlined" onClick={this.onZoomReset}>
              0
            </Button>
            <Button className={classes.button} variant="outlined" onClick={this.onZoomOut}>
              -
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(ClipPathBilder);
