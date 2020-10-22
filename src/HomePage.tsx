import {
  Button,
  createStyles,
  FormControlLabel,
  Switch,
  withStyles,
  WithStyles
} from "@material-ui/core";
import React, {Component} from "react";
import ClipPathBuilder, {Point} from "./ClipPathBuilder";

const styles = () =>
  createStyles({
    root: {
      width: "100vw",
      height: "100vh",
    },
    clipPathBilderContainer: {
      display: "flex",
      justifyContent: "center",
      marginTop: "10px",
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

type Props = WithStyles<typeof styles>;

interface State {
  points: Point[];
  zoom: number;
  hideBoxes: boolean;
}

class HomePage extends Component<Props, State> {
  public readonly state: State = {points: [], zoom: 1, hideBoxes: false};

  private pointToStr = (point: Point) => `${point.top}${point.unit} ${point.left}${point.unit}`;

  private onChange = (points: Point[]) => this.setState({points: points});

  private onSave = () => console.log(this.state.points.map(this.pointToStr).join(", "));

  private onDelete = () => this.setState({points: []});

  private onZoomIn = () => this.setState({zoom: this.state.zoom + 5});

  private onZoomOut = () => this.setState({zoom: this.state.zoom - 0.2});

  private onZoomReset = () => this.setState({zoom: 1});

  private onHideBoxes = (event: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({hideBoxes: event.target.checked});

  render() {
    const {classes} = this.props;
    const {points, zoom, hideBoxes} = this.state;

    return (
      <div className={classes.root}>
        <div className={classes.clipPathBilderContainer}>
          <ClipPathBuilder
            src=""
            alt="sdf"
            points={points}
            zoom={zoom}
            hideBoxes={hideBoxes}
            onChange={this.onChange}
          />
        </div>
        <div>
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
          <div className={classes.buttonContainer}>
            <Button className={classes.button} variant="outlined" onClick={this.onSave}>
              Speichern
            </Button>
            <Button className={classes.button} variant="outlined" onClick={this.onDelete}>
              Löschen
            </Button>
          </div>
          <div className={classes.buttonContainer}>
            <FormControlLabel
              value="start"
              control={<Switch color="primary" onChange={this.onHideBoxes} />}
              label="Boxen ausblenden"
              labelPlacement="start"
            />
          </div>
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(HomePage);
