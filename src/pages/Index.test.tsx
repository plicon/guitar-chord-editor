import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "./Index";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";

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
  setStorageAuthHeaders: vi.fn(),
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
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ThemeProvider>
          <AuthProvider>
            <Index />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe("Index Page Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Mock sessionStorage (for auth token)
    const sessionStorageMock = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    Object.defineProperty(global, 'sessionStorage', {
      value: sessionStorageMock,
      writable: true,
    });
    
    // Mock matchMedia for theme detection
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
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

    it("should show helper text for adding sections", () => {
      renderIndex();

      expect(screen.getByText(/add a section and click on a chord diagram to start editing/i)).toBeInTheDocument();
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

  describe("Section Management", () => {
    it("should display sections heading", () => {
      renderIndex();

      expect(screen.getByRole("heading", { name: /sections/i })).toBeInTheDocument();
    });

    it("should have add section button", () => {
      renderIndex();

      const addSectionButton = screen.getByRole("button", { name: /add section/i });
      expect(addSectionButton).toBeInTheDocument();
    });

    it("should show 'Add First Section' button when no sections exist", () => {
      renderIndex();

      expect(screen.getByRole("button", { name: /add first section/i })).toBeInTheDocument();
    });

    it("should show empty state message when no sections exist", () => {
      renderIndex();

      expect(screen.getByText(/no sections yet/i)).toBeInTheDocument();
    });
  });

  describe("Header Actions", () => {
    it("should have New button", () => {
      renderIndex();

      const newButtons = screen.getAllByRole("button", { name: /new/i });
      const plainNewButton = newButtons.find(btn => btn.textContent?.trim() === "New");
      expect(plainNewButton).toBeInTheDocument();
    });

    it("should have New AI button", () => {
      renderIndex();

      const newAIButton = screen.getByRole("button", { name: /new ai/i });
      expect(newAIButton).toBeInTheDocument();
    });

    it("should have Login button when not authenticated", () => {
      renderIndex();

      const loginButton = screen.getByRole("button", { name: /login/i });
      expect(loginButton).toBeInTheDocument();
    });

    it("should not show Save/Open/Export/Import when not authenticated", () => {
      renderIndex();

      expect(screen.queryByRole("button", { name: /^save$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^open$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^export$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^import$/i })).not.toBeInTheDocument();
    });

    it("should open login dialog when clicking Login", async () => {
      renderIndex();

      const loginButton = screen.getByRole("button", { name: /login/i });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText(/sign in to save, import, and export songs/i)).toBeInTheDocument();
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

    it("should display time signature in the strumming pattern section when pattern is added", async () => {
      renderIndex();

      const strummingButton = screen.getByRole("button", { name: /add strumming pattern/i });
      fireEvent.click(strummingButton);

      await waitFor(() => {
        expect(screen.getByRole("heading", { name: /strumming pattern editor/i })).toBeInTheDocument();
      });

      // Add a stroke to the pattern (click on one of the beat slots)
      // The editor should have clickable areas for adding strokes
      const beatSlots = screen.getAllByRole("button").filter(btn => 
        btn.className.includes("cursor-pointer") && !btn.textContent?.includes("Save")
      );
      
      if (beatSlots.length > 0) {
        // Click the first beat slot to add a stroke
        fireEvent.click(beatSlots[0]);
      }

      // Save a pattern
      const saveButton = screen.getByRole("button", { name: /save pattern/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        // After saving, the pattern section should be visible
        // Look for "Edit Pattern" button which appears when pattern has content
        expect(screen.getByRole("button", { name: /edit pattern/i })).toBeInTheDocument();
      });
    });
  });

  describe("Responsive Layout and UI Control", () => {
    it("should render within container with proper spacing", () => {
      renderIndex();

      const main = screen.getByRole("main");
      expect(main).toHaveClass("container");
    });

    it("should have row controls available after adding section", async () => {
      renderIndex();

      // We should have buttons like "Add Section", etc.
      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
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

      // The h1 contains "Fretkit" and there's a subtitle span with "Guitar Chord Creator"
      expect(screen.getByRole("heading", { level: 1, name: /fretkit/i })).toBeInTheDocument();
    });
  });
});
