import React from "react";
import "../styles/HelpFooter.css";

const HelpFooter = () => {
  return (
    <footer className="help-footer" id="app-footer">
      <div className="help-footer-content">
        <h2 className="help-title">Need Help?</h2>
        <p className="help-description">
          Get the most out of our AI-powered route intelligence. Whether you're
          looking for new route opportunities or analyzing existing ones, we're
          here to help.
        </p>
        
        <div className="help-actions">
          <a href="mailto:support@tickmybus.com" className="help-btn">
            Contact Support
          </a>
          <span className="help-separator">|</span>
          <a href="#" className="help-btn">
            Documentation
          </a>
          <span className="help-separator">|</span>
          <a href="#" className="help-btn">
            FAQs
          </a>
        </div>
      </div>
      
      <div className="footer-bottom-line">
        <div className="footer-divider-line"></div>
        <p>© {new Date().getFullYear()} Route Analysis AI | Powered by AIM UNIVERSSE</p>
      </div>
    </footer>
  );
};

export default HelpFooter;
