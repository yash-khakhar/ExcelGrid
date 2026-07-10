# CanvasGrid Spreadsheet  

---

## 🎯 Project Name and Objective

**Project Name:** CanvasGrid Spreadsheet  
**Objective:** To build a fully modular, zero-dependency spreadsheet interface from scratch utilizing the HTML5 Canvas API. The engine is engineered to bypass DOM performance limitations, facilitating instantaneous scrolling, fluid data navigation, and layout rendering for ultra-dense data structures (supporting up to **100,000+ rows and 500+ columns** seamlessly).

---

## 🚀 Features Implemented

* **Virtual Grid Matrix:** High-performance render pipelines tracking only visible bounding zones to keep system memory clear.
* **Trackpad & Wheel Scroll Panning:** Bypasses browser pointer locks so users can click and hold selections while panning rows and columns simultaneously.
* **Dynamic Hover Text Input Overlay:** Double-clicking deep cellular strings expands an interactive overlay that dynamically increases in width on every keystroke to prevent text clipping.
* **Smart Caret-Aware Key Navigation:** Arrow keys shift cell focus. If a cell is active in Edit Mode, `ArrowLeft` or `ArrowRight` navigate character inputs natively, jumping to neighboring cells only when the caret strikes text boundary limits.
* **Massive Range Multi-Selections:** Click headers to select entire structural dimensions instantly, with optimization buffers to prevent UI thread freezing when executing 50M+ cells allocations.
* **Layout Modification Tracking:** Real-time canvas column and row edge boundaries resizing loops handled dynamically.
* **Atomic Transaction Processing:** Unified history command engine mapping text input modifications and grid structural dimension alterations.

---

## 📂 Folder and Class Structure

The engine layout implements a highly clean **Separation of Concerns (SoC)** approach to keep architectural elements isolated, eliminating circular dependency loops:

```text
src/
│
├── config/
│   └── constants.ts             # Immutable literal constants (Pixel rules, limits)
│
├── core/
│   └── spreadsheet.ts           # Central System Controller (Orchestrator Layer)
│
├── events/
│   └── eventManager.class.ts    # Captures mouse, keyboard, trackpad, and canvas gestures
│
├── interface/                   # Structural type contracts
│   ├── CellCoord.ts             # Shape contract for an isolated single row and column index
│   ├── ClickCoords.ts           # Tracks mouse canvas offsets and row/col header boolean flags
│   ├── ResizeTarget.ts          # Tracks sizing flags, indexes, and start size baselines
│   ├── Command.ts               # Interface blueprint outlining execute/undo requirements
│   ├── MetricsResult.ts         # Holds values for statistical calculations (Count, Sum, Avg, Min, Max)
│   ├── NormalizedRange.ts       # Enforces top-left to bottom-right ordered bounding parameters
│   └── SelectionRange.ts        # Maps the initial starting point and final drag boundaries
│
├── models/                      # Pure Data & Domain Logic (State Repository)
│   ├── dataManager.class.ts     # Holds cell matrices data and tracking offsets arrays
│   └── selectionManager.class.ts# Controls range frames bounding contexts & statistical metrics
│
├── commands/                    # Operational Transactions (Action Framework)
│   ├── commandManager.class.ts  # Master Action History Stack Management
│   ├── editCellCommand.class.ts # Isolated cell entry data mutation log
│   └── resizeCommand.class.ts   # Isolated col/row dimension transformation log
│
├── view/                        # Graphical Presentation Layer
│   └── renderEngine.class.ts    # Controls low-level HTML5 canvas matrix draws
│
└── utils/                       # Global Helper Modules
    └── jsonLoader.class.ts      # Pipeline reading and validating raw external layout files  
```  

## 🏗️ Object-Oriented Programming (OOP) Application  
The architecture heavily relies on core OOP pillars to organize logic responsibly:  
* Encapsulation: Internal state parameters like the active canvas tracking arrays (rowPositions, colPositions) or specific tracking flags (isMouseDown) are set as private variables. They can only be modified through clean, public method checkpoints like setScroll() or resizeCol().  
* Abstraction: The complex coordinate translation algorithms required to locate rows/columns under raw pixel locations are hidden away within simple utility calls like getCellAtPixels(). The rest of the application interacts with basic grid addresses (row, col) rather than raw cursor offsets.  
* Polymorphism: The transaction stack applies uniform interfaces to execute divergent operations. Both text modifications and grid expansion loops follow an implementation contract containing simple .execute() and .undo() workflows.  

## 🧩 SOLID Principles Application  
* Single Responsibility Principle (SRP): Each class owns exactly one core operational domain. RenderEngine is solely responsible for rendering graphics onto the canvas buffer. EventManager parses input loops, while DataManager houses business rule coordinates.  
* Open/Closed Principle (OCP): The logging infrastructure can expand infinitely. If you choose to add cell style formatting features later (e.g., color fills, text aligning), you can drop in a new Command subclass without refactoring code in the main execution loops.  
* Liskov Substitution Principle (LSP): Any operational action subtype extending the system configuration contracts can substitute its parent implementation anywhere without altering execution safety constraints.  
* Interface Segregation Principle (ISP): Type definitions are systematically split up into lightweight files (CellCoord, ResizeTarget). Classes never import wide, unified monolithic configurations.  
* Dependency Inversion Principle (DIP): The EventManager captures abstract interface lookups against the main system component class via decoupled public methods rather than directly manipulating raw data arrays inside core memory managers.  

## 🛠️ Design Patterns: The Command Pattern & Undo/Redo  
The spreadsheet manages user edits and structural layout changes through the Command Pattern. This pattern converts an action into a self-contained object containing all the contextual information needed to execute or reverse that action.  

**Workflow Pipeline:**  
1. When an operation finishes (e.g., editing cell text or dragging a row size handle), an execution wrapper class instance (EditCellCommand or ResizeCommand) is initialized with its baseline parameters, state metadata, old values, and new values.  
2. The command is handed to the CommandManager, which immediately triggers .execute().  
3. The command object is pushed onto a history stack array (undoStack), and any remaining elements in the redoStack are cleared.  
4. Undo Operation: When Ctrl + Z triggers, the CommandManager pops the top action from the undoStack, invokes .undo() to restore the cached historical parameters, and pushes it onto the redoStack.  

## ⚡ How Virtual Rendering Works  
Rendering 100,000 rows and 500 columns simultaneously on a traditional webpage DOM generates millions of heavy elements, grinding performance down to a crawl. This engine achieves extreme optimization by utilizing Virtual Rendering:  
* The system maps structural layout positions linearly within index location lookup arrays.  
* During any draw tick execution, the engine evaluates the current frame coordinates using scrollX and scrollY parameters against the boundaries of the viewport width and height.  
* A binary-search helper array lookup determines the precise index slice window range of data elements visible only inside that physical rectangle.  
* Only the visible cells are rendered. If a user scrolls 50 pixels down, the system shifts its visible window parameters, clears the canvas, and renders the newly revealed row data instantly. Cells that scroll off-screen are immediately skipped, reducing iteration lookups from millions to a few hundred.  

## 📦 How Data is Generated and Loaded  
* Grid Ingestion Initialization: The DataManager initializes arrays by projecting configurations out to the limits set in SPREADSHEET_CONFIG. Column sizes are structured using letters, and row indices map sequential numeric sequences.  
* File Processing Pipelines: Mass records uploads bypass internal runtime storage constraints via the decoupled JSONLoader structure.  
* Transaction Safety Guard: Loading a JSON file does not overwrite data destructively. The ingestion logic translates the payload matrix into an atomic command operation (LoadFileCommand) and pushes it onto the operational history stack. This allows users to undo a massive file import and restore their original spreadsheet state instantly.  

## ⚠️ Known Limitations  
While highly optimized for massive datasets, the engine currently has the following scope constraints:  
* Single-Line Text Overlay: The floating text edit input handles wide expansions beautifully but is confined to single-line text data inputs; multiline cell text wrapping (Alt + Enter functionality) is not natively split within the canvas rendering matrices.  
* Bypassed Full-Sheet Analytics: When selecting the absolute whole grid matrix (50 Million+ cells via the top-left intersect corner click), real-time status bar statistics (Sum, Average) are explicitly truncated or bypassed to avoid main-thread script time execution blocks.  
* Formula Parsing Deprivation: Text string entries beginning with = are handled as raw primitive string inputs; the engine does not evaluate cell dependencies, math evaluations (=SUM(A1:B12)), or cross-coordinate string parsing.  
* Sparse Layout Memory Expansion: The layout coordinates arrays (rowPositions, colPositions) currently scale sequentially in flat arrays up to maximum capacities. For bounds scaling into billions of rows, a flat array architecture introduces memory footprints that require structural segmentation.  

## 🔮 Next Improvements  
To scale this layout component into a production-grade enterprise spreadsheet tool, the following enhancements are queued:  
* Sparse Matrix Data Layer: Upgrading the DataManager internal dictionary representation to a pure sparse map object key strategy Record<string, string> rather than dense allocations to minimize heap overhead.  
* Web Worker Parallel Calculation Layer: Offloading multi-million cell range statistics computations (calculateMetrics) and intricate formula parsing blocks away from the main UI browser thread into background Web Workers.  
* Extended Cell Formatting Commands: Adding inline stylistic state layers (text coloring, background font styling, clipping masks, numerical date alignments) fully compatible with the active Command undo/redo transaction stack pipelines.  

## ⚙️ How to Install and Run  
1. Installation  
Clone the spreadsheet source files container directly into your preferred project storage folder, then install development dependencies:  
```bash  
npm install  
```  

2. Compile TypeScript  
```bash  
npm run build  
```  

3. Serve the Application  
Because browser security protocols prevent native JavaScript modules (import/export) from running directly off local file structures (file://), serve the source root using a simple local web server:  
```bash  
npm run dev  
```

Open the provided local loop address (e.g., http://localhost:3000) in web browser to interact with the spreadsheet!  
