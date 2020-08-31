import {createStyles, withStyles, WithStyles} from "@material-ui/core";
import React, {Component} from "react";
import {POINT_BOX_SIZE} from "./Constants";

const styles = () =>
  createStyles({
    root: {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    img: {
      position: "relative",
      width: "400px",
      height: "500px",
      border: "1px solid black",
      cursor: "crosshair",
    },
    point: {
      position: "absolute",
      width: `${POINT_BOX_SIZE}px`,
      height: `${POINT_BOX_SIZE}px`,
      border: "1px solid green",
      cursor: "grab",
    },
    svg: {
      width: "100%",
      height: "100%",
    },
  });

interface Point {
  unit: string;
  top: number;
  left: number;
}

type Props = WithStyles<typeof styles>;
interface State {
  points: Point[];
  active: number;
}

class ClipPathBilder extends Component<Props, State> {
  public readonly state: State = {points: [], active: -1};

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

  private createLine = (point: Point, next: Point) => {
    const key = `${point.top}x${point.left}_line`;
    return (
      <line key={key} x1={point.left} y1={point.top} x2={next.left} y2={next.top} stroke="black" />
    );
  };

  render() {
    const {classes} = this.props;
    const {points, active} = this.state;

    return (
      <div className={classes.root}>
        <div
          className={classes.img}
          onMouseUp={active === -1 ? this.addPoint : this.releasePoint}
          onMouseMove={active > -1 ? this.movePoint : () => false}
          id="staticImage"
        >
          <svg className={classes.svg}>
            {points.map((point, idx, points) => {
              if (points.length < 2) return null;
              const next = idx === points.length - 1 ? points[0] : points[idx + 1];
              return this.createLine(point, next);
            })}
          </svg>
          {points.map((point, idx) => {
            const key = `${point.top}x${point.left}_box`;
            const style = {
              top: point.top - (0.5 * POINT_BOX_SIZE + 2), // 2px fadenkreuz
              left: point.left - (0.5 * POINT_BOX_SIZE + 2), // 2px fadenkreuz
              cursor: idx === active ? "grabbing" : "grab",
            };
            return (
              <div
                key={key}
                style={style}
                className={classes.point}
                onMouseDown={this.grabPoint(idx)}
              />
            );
          })}
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(ClipPathBilder);
