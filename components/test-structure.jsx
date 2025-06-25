// This is a simplified version of the Dialer component structure
// to help identify where the JSX structure is broken

export function TestStructure() {
  return (
    <>
      <div className="dialog">
        <div className="dialog-content">
          <div className="flex-col">
            {/* Header */}
            <div className="header">
              <div className="left-side">
                <span>Icon</span>
                <h2>Title</h2>
                <span>Badge</span>
              </div>
              
              <div className="right-side">
                <button>Button</button>
              </div>
            </div>
            
            {/* Content */}
            <div className="content">
              <div className="left-panel">
                <h3>Left Panel</h3>
              </div>
              
              <div className="right-panel">
                <div className="tabs">
                  <button>Tab 1</button>
                  <button>Tab 2</button>
                </div>
                
                <div className="tab-content">
                  Content here
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
