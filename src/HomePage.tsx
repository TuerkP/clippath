import {Button, makeStyles} from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import EditIcon from "@material-ui/icons/Edit";
import React, {useRef, useState} from "react";
import ClipPathBuilder, {Point} from "./ClipPathBuilder";
import Menu, {MenuItem} from "./Menu";

const useStyles = makeStyles({
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
  previewContainer: {
    marginTop: "10px",
    display: "flex",
    justifyContent: "center",
    position: "relative",
  },
  preview: {
    border: "1px solid black",
    position: "relative",
    width: "fit-content",
    height: "fit-content",
  },
  clickArea: {
    width: "100%",
    height: "100%",
    top: 0,
    left: 0,
    position: "absolute",
    display: "block",
    cursor: "pointer",
    "&:hover": {
      background: "white",
      opacity: 0.4,
    },
  },
});

interface Position {
  x: number;
  y: number;
}

interface ClickAreaMenuData {
  position: Position;
  areaIdx: number;
}

function HomePage() {
  const classes = useStyles();

  const previewRef = useRef() as React.MutableRefObject<HTMLDivElement>;

  const [points, setPoints] = useState<Point[]>([]);
  const [savedPoints, setSavedPoints] = useState<Point[][]>([]);
  const [zoom, setZoom] = useState(1);
  const [menuData, setMenuData] = useState<ClickAreaMenuData | undefined>();

  const pointToStr = (point: Point) => `${point.left}% ${point.top}%`;

  const onChange = (points: Point[]) => setPoints(points);

  const onSave = () => {
    if (points.length >= 3) {
      setSavedPoints([...savedPoints, points]);
      setPoints([]);
    } else {
      console.warn("At least 3 points are required for a clickable area.");
    }
  };

  const onDelete = () => setPoints([]);

  const onZoomIn = () => setZoom(zoom + 0.2);

  const onZoomOut = () => setZoom(zoom - 0.2);

  const onZoomReset = () => setZoom(1);

  const onEditArea = () => {
    if (menuData !== undefined) {
      setPoints(savedPoints[menuData.areaIdx]);
      setSavedPoints(savedPoints.filter((__, idx) => idx !== menuData.areaIdx));
    }
  };

  const onDeleteArea = () => {
    if (menuData !== undefined) {
      setSavedPoints(savedPoints.filter((__, idx) => idx !== menuData.areaIdx));
    }
  };

  const showMenu = (areaIdx: number) => (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (previewRef.current) {
      const rect = previewRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      setMenuData({position: {x, y}, areaIdx: areaIdx});
    }
  };

  const hideMenu = () => setMenuData(undefined);

  return (
    <div className={classes.root}>
      <div className={classes.clipPathBilderContainer}>
        <ClipPathBuilder
          src="https://www.prlog.org/11283630-prehbmw-idrive-controller.jpg"
          alt="editor"
          points={points}
          zoom={zoom}
          onChange={onChange}
        />
      </div>
      <div>
        <div className={classes.buttonContainer}>
          <Button className={classes.button} variant="outlined" onClick={onZoomIn}>
            +
          </Button>
          <Button className={classes.button} variant="outlined" onClick={onZoomReset}>
            0
          </Button>
          <Button className={classes.button} variant="outlined" onClick={onZoomOut}>
            -
          </Button>
        </div>
        <div className={classes.buttonContainer}>
          <Button
            className={classes.button}
            variant="outlined"
            onClick={onSave}
            disabled={points.length <= 2}
          >
            Speichern
          </Button>
          <Button className={classes.button} variant="outlined" onClick={onDelete}>
            Löschen
          </Button>
        </div>
      </div>
      <div className={classes.previewContainer}>
        <div ref={previewRef} className={classes.preview}>
          <img src="https://www.prlog.org/11283630-prehbmw-idrive-controller.jpg" alt="preview" />
          {savedPoints.map((points, areaIdx) => (
            <div
              key={areaIdx}
              style={{clipPath: `polygon(${points.map(pointToStr).join(", ")})`}}
              className={classes.clickArea}
              onClick={showMenu(areaIdx)}
            />
          ))}
          {menuData && (
            <Menu relativePosition={menuData.position} onClose={hideMenu}>
              <MenuItem onClick={onEditArea} icon={<EditIcon />}>
                Bearbeiten
              </MenuItem>
              <MenuItem onClick={onDeleteArea} icon={<DeleteIcon />}>
                Löschen
              </MenuItem>
            </Menu>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
