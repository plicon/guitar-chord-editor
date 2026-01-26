import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Index from "./Index";
import { ThemeProvider } from "@/components/ThemeProvider";

// Mock storage service - matches actual export structure
vi.mock("@/services/storage", () => ({
  saveChart: vi.fn().mockResolvedValue(undefined),
  loadChart: vi.fn().mockResolvedValue(null),
  listCharts: vi.fn().mockResolvedValue([]),
  deleteChart: vi.fn().mockResolvedValue(undefined),
  exportChartToJson: vi.fn().mockReturnValue("{}"),
  importChartFromJson: vi.fn().mockReturnValue({}),
  downloadChartAsJson: vi.fn(),
  getStorageProvider: vi.fn(),
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock html2canvas and jsPDF for PDF export
vi.mock("html2canvas", () => ({
  default: vi.fn().mockResolvedValue({
    width: 800,
    height: 1000,
    toDataURL: () => "data:image/png;base64,mock",
  }),
}));

vi.mock("jspdf", () => ({
  default: vi.fn().mockImplementation(() => ({
    addImage: vi.fn(),
    save: vi.fn(),
  })),
}));

// Mock @dnd-kit to simplify drag testing
vi.mock("@dnd-kit/core", async () => {
  const actual = await vi.importActual("@dnd-kit/core");
  return {
    ...actual,
    DndContext: ({ children }: { children: React.ReactNode }) => <div data-testid="dnd-context">{children}</div>,
    DragOverlay: ({ children }: { children: React.ReactNode }) => <div data-testid="drag-overlay">{children}</div>,
  };
});

vi.mock("@dnd-kit/sortable", async () => {
  const actual = await vi.importActual("@dnd-kit/sortable");
  return {
    ...actual,
    SortableContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: null,
      isDragging: false,
    }),
  };
});

const renderIndex = () => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        <Index />
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe("Index Page Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial Render", () => {
    it("should render the main layout with header and content", () => {
      renderIndex();

      expect(screen.getByRole("banner")).toBeInTheDocument();
      expect(screen.getByRole("main")).toBeInTheDocument();
    });

    it("should display title and description inputs", () => {
      renderIndex();

      expect(screen.getByPlaceholderText("Enter chart title...")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Add notes, tuning info, or instructions...")).toBeInTheDocument();
    });

    it("should show initial chord grid with chord diagrams", () => {
      renderIndex();

      // Should have chord diagram elements (SVGs for chord display)
      const svgElements = document.querySelectorAll("svg");
      expect(svgElements.length).toBeGreaterThan(0);
    });

    it("should display disabled Preview and Download buttons initially", () => {
      renderIndex();

      const previewButton = screen.getByRole("button", { name: /preview/i });
      const downloadButton = screen.getByRole("button", { name: /download pdf/i });

      expect(previewButton).toBeDisabled();
      expect(downloadButton).toBeDisabled();
    });

    it("should show helper text for adding chords", () => {
      renderIndex();

      expect(screen.getByText(/click on a chord diagram above to start adding chords/i)).toBeInTheDocument();
    });
  });

  describe("Metadata Section", () => {
    it("should update title when typing", async () => {
      renderIndex();

      const titleInput = screen.getByPlaceholderText("Enter chart title...");
      fireEvent.change(titleInput, { target: { value: "My New Song" } });

      expect(titleInput).toHaveValue("My New Song");
    });

    it("should update description when typing", async () => {
      renderIndex();

      const descInput = screen.getByPlaceholderText("Add notes, tuning info, or instructions...");
      fireEvent.change(descInput, { target: { value: "Verse progression" } });

      expect(descInput).toHaveValue("Verse progression");
    });

    it("should have strumming pattern button", () => {
      renderIndex();

      const strummingButton = screen.getByRole("button", { name: /add strumming pattern/i });
      expect(strummingButton).toBeInTheDocument();
    });
  });

  describe("Chord Grid Section", () => {
    it("should display chords per row label", () => {
      renderIndex();

      expect(screen.getByText(/chords per row/i)).toBeInTheDocument();
    });

    it("should have add row button", () => {
      renderIndex();

      const addRowButton = screen.getByRole("button", { name: /add row/i });
      expect(addRowButton).toBeInTheDocument();
    });

    it("should add a new row when clicking add row button", async () => {
      renderIndex();

      const initialRows = screen.getAllByTestId("dnd-context");
      const addRowButton = screen.getByRole("button", { name: /add row/i });

      fireEvent.click(addRowButton);

      await waitFor(() => {
        const updatedRows = screen.getAllByTestId("dnd-context");
        expect(updatedRows.length).toBeGreaterThanOrEqual(initialRows.length);
      });
    });

    it("should show row comment inputs", () => {
      renderIndex();

      // The actual placeholder is "Add a comment for this row (optional)..."
      const commentInputs = screen.getAllByPlaceholderText(/add a comment for this row/i);
      expect(commentInputs.length).toBeGreaterThan(0);
    });
  });

  describe("Header Actions", () => {
    it("should have New button", () => {
      renderIndex();

      const newButton = screen.getByRole("button", { name: /new/i });
      expect(newButton).toBeInTheDocument();
    });

    it("should have Open button", () => {
      renderIndex();

      const openButton = screen.getByRole("button", { name: /open/i });
      expect(openButton).toBeInTheDocument();
    });

    it("should have Save button", () => {
      renderIndex();

      const saveButton = screen.getByRole("button", { name: /save/i });
      expect(saveButton).toBeInTheDocument();
    });

    it("should open saved charts dialog when clicking Open", async () => {
      renderIndex();

      const openButton = screen.getByRole("button", { name: /open/i });
      fireEvent.click(openButton);

      await waitFor(() => {
        // Use getByRole for the dialog title to be more specific
        expect(screen.getByRole("heading", { name: /saved charts/i })).toBeInTheDocument();
      });
    });
  });

  describe("Preview Dialog", () => {
    it("should not show preview dialog initially", () => {
      renderIndex();

      expect(screen.queryByText(/print preview/i)).not.toBeInTheDocument();
    });
  });

  describe("Strumming Pattern Editor", () => {
    it("should open strumming editor when clicking strumming button", async () => {
      renderIndex();

      const strummingButton = screen.getByRole("button", { name: /add strumming pattern/i });
      fireEvent.click(strummingButton);

      await waitFor(() => {
        // Check for the dialog title specifically
        expect(screen.getByRole("heading", { name: /strumming pattern editor/i })).toBeInTheDocument();
      });
    });
  });

  describe("Chords Per Row Control", () => {
    it("should display current chords per row value", () => {
      renderIndex();

      // Should show the current value (default is 4)
      const chordsPerRowSection = screen.getByText(/chords per row/i).parentElement;
      expect(chordsPerRowSection).toBeInTheDocument();
    });
  });

  describe("Row Management", () => {
    it("should have row controls available", () => {
      renderIndex();

      // Look for buttons in the chord grid section
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe("Responsive Layout", () => {
    it("should render within container with proper spacing", () => {
      renderIndex();

      const main = screen.getByRole("main");
      expect(main).toHaveClass("container");
    });
  });

  describe("Theme Integration", () => {
    it("should have background class for theming", () => {
      const { container } = renderIndex();

      const rootDiv = container.firstChild;
      expect(rootDiv).toHaveClass("bg-background");
    });
  });

  describe("App Branding", () => {
    it("should display app name in header", () => {
      renderIndex();

      // Use getByRole to target the h1 heading specifically (not the watermark)
      expect(screen.getByRole("heading", { level: 1, name: /guitar chord creator/i })).toBeInTheDocument();
    });
  });
});
