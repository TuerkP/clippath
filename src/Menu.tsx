import {Button, ClickAwayListener, makeStyles} from "@material-ui/core";
import React from "react";

interface Position {
  x: number;
  y: number;
}

interface StyleProps {
  pos: Position;
}

const useMenuStyles = makeStyles({
  container: (props: StyleProps) => ({
    position: "absolute",
    top: props.pos.y,
    left: props.pos.x,
    backgroundColor: "#FFFFFF",
    borderRadius: "4px",
    display: "flex",
    flexDirection: "column",
  }),
});

const useMenuItemStyles = makeStyles({
  menuItem: {
    padding: "10px",
    borderRadius: "0px",
    justifyContent: "left",
  },
});

interface Props {
  open: boolean;
  relativePosition: Position;
  onClose: (event: React.MouseEvent<Document, MouseEvent>) => void;
  children?: React.ReactNode[];
}

export default function Menu(props: Props) {
  const classes = useMenuStyles({pos: props.relativePosition});
  return props.open ? (
    <ClickAwayListener onClickAway={props.onClose}>
      <div className={classes.container}>{props.children}</div>
    </ClickAwayListener>
  ) : null;
}

interface MenuItemProps {
  icon: React.ReactNode;
  children: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export function MenuItem(props: MenuItemProps) {
  const classes = useMenuItemStyles();
  return (
    <Button
      onClick={props.onClick}
      startIcon={props.icon}
      fullWidth={true}
      className={classes.menuItem}
    >
      {props.children}
    </Button>
  );
}
