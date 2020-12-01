import {Button, ClickAwayListener, makeStyles} from "@material-ui/core";
import React, {useContext} from "react";

interface Position {
  x: number;
  y: number;
}

type CloseEvent = React.MouseEvent<Document | HTMLButtonElement, MouseEvent>;

interface MenuContext {
  closeMenu: (event: CloseEvent) => void;
}

const menuContext = React.createContext<MenuContext>({
  closeMenu: () => void 0,
});

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
    width: "fit-content",
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
  relativePosition: Position;
  onClose: (event: CloseEvent) => void;
  children?: React.ReactNode;
}

export default function Menu(props: Props) {
  const classes = useMenuStyles({pos: props.relativePosition});
  return (
    <ClickAwayListener onClickAway={props.onClose}>
      <div className={classes.container}>
        <menuContext.Provider value={{closeMenu: props.onClose}}>
          {props.children}
        </menuContext.Provider>
      </div>
    </ClickAwayListener>
  );
}

interface MenuItemProps {
  icon?: React.ReactNode;
  children: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

export function MenuItem(props: MenuItemProps) {
  const classes = useMenuItemStyles();

  const ctx = useContext(menuContext);

  const onClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    ctx.closeMenu(event);
    props.onClick && props.onClick(event);
  };

  return (
    <Button onClick={onClick} startIcon={props.icon} fullWidth={true} className={classes.menuItem}>
      {props.children}
    </Button>
  );
}
