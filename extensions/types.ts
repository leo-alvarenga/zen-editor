import { ThemeColor, WidgetPlacement } from "@earendil-works/pi-coding-agent";

export type Mode = "normal" | "insert";

export type ModeSettings = {
  /** The label to display for the mode */
  label: string;

  /** The icon to display for the mode. Defaults to a generic icon if not specified */
  icon?: string;

  /** The color to use for the mode. Defaults to `accent` if not specified */
  color?: ThemeColor;
};

export type WidgetSettings = {
  /** Whether to enable the widget. Defaults to false if not specified */
  enable?: boolean;

  /** The placement of the widget on the screen. Defaults to "aboveEditor" if not specified. */
  placement?: WidgetPlacement;

  /** Mode-specific settings for the widget */
  modes?: Partial<Record<Mode, ModeSettings>>;
};

export type Settings = {
  widget?: WidgetSettings;
  editor?: {
    /** Whether to enable the badge in the editor. Defaults to false if not specified */
    enableBadge?: boolean;
  };
};
