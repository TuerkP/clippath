import {createStyles, withStyles, WithStyles} from "@material-ui/core";
import React, {Component} from "react";
import ClipPathBilder from "./ClipPathBilder";

const styles = () =>
  createStyles({
    root: {
      width: "100vw",
      height: "100vh",
    },
  });

type Props = WithStyles<typeof styles>;

class HomePage extends Component<Props> {
  render() {
    const {classes} = this.props;
    return (
      <div className={classes.root}>
        <ClipPathBilder
          src=""
          alt="sdf"
        />
      </div>
    );
  }
}

export default withStyles(styles)(HomePage);
