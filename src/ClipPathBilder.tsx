import {createStyles, withStyles, WithStyles, Button} from "@material-ui/core";
import React, {Component} from "react";
import {POINT_BOX_SIZE} from "./Constants";

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
    container: {
      position: "relative",
      border: "1px solid black",
      cursor: "crosshair",
    },
    img: {
      display: "block",
    },
    point: {
      position: "absolute",
      width: `${POINT_BOX_SIZE}px`,
      height: `${POINT_BOX_SIZE}px`,
      border: "2px solid green",
      cursor: "grab",
    },
    svg: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
    },
    button: {
      marginTop: "10px",
      marginLeft: "10px"
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

interface State {
  points: Point[];
  active: number;
}

class ClipPathBilder extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {points: props.points ?? [], active: -1};
  }

  private addPoint = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const newPoint: Point = {
      top: event.nativeEvent.offsetY,
      left: event.nativeEvent.offsetX,
      unit: "px",
    };
    this.setState({points: [...this.state.points, newPoint]});
  };

  private grabPoint = (idx: number) => () => {
    this.setState({active: idx});
  };

  private movePoint = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const points = [...this.state.points]; // Kopie von Points erstellen
    const activePoint = points[this.state.active];
    points[this.state.active] = {
      top: activePoint.top + event.movementY,
      left: activePoint.left + event.movementX,
      unit: "px",
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
    return (
      <line key={key} x1={point.left} y1={point.top} x2={next.left} y2={next.top} stroke="white" />
    );
  };

  private createPoint = (point: Point, idx: number) => {
    const {classes} = this.props;
    const {active} = this.state;
    const key = `${point.top}x${point.left}_box`;
    const style = {
      top: point.top - (0.5 * POINT_BOX_SIZE + 2), // 2px fadenkreuz
      left: point.left - (0.5 * POINT_BOX_SIZE + 2), // 2px fadenkreuz
      cursor: idx === active ? "grabbing" : "grab",
    };
    return (
      <div key={key} style={style} className={classes.point} onMouseDown={this.grabPoint(idx)} />
    );
  };

  private onSave = () => {
    const {onSave} = this.props;
    if (onSave !== undefined) {
      onSave(this.state.points);
    }
  };

  private onDelete = () => {
    this.setState({points: []})
  }

  render() {
    const {src, alt, classes} = this.props;
    const {points, active} = this.state;

    return (
      <div className={classes.root}>
        <div
          className={classes.container}
          onMouseUp={active === -1 ? this.addPoint : this.releasePoint}
          onMouseMove={active > -1 ? this.movePoint : () => false}
        >
          <img src={src} alt={alt} className={classes.img} />
          <svg className={classes.svg}>{points.map(this.createLine)}</svg>
          {points.map(this.createPoint)}
        </div>
        <div>
          <Button className={classes.button} variant="outlined" onClick={this.onSave}>
            Speichern
          </Button>
          <Button className={classes.button} variant="outlined" onClick={this.onDelete}>
            Löschen
          </Button>
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(ClipPathBilder);
