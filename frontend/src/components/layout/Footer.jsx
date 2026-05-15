export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold text-gov-900">Namma Bengaluru Clean</h3>
            <p className="text-sm text-gray-500 mt-1">Official Citizen Engagement Portal</p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-gov-900 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gov-900 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-gov-900 transition-colors">Department Directory</a>
            <a href="#" className="hover:text-gov-900 transition-colors">Contact Us</a>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            © 2024 Bruhat Bengaluru Mahanagara Palike (BBMP). All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
