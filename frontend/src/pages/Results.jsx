import { useState, useEffect } from 'react';
import axios from '../utils/axios';
import AdminLayout from '../components/AdminLayout';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Results = () => {
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    const { data } = await axios.get('/api/results');
    setResults(data);
  };

  const handlePublish = async (id) => {
    try {
      await axios.put(`/api/results/publish/${id}`);
      toast.success('Result published');
      fetchResults();
    } catch (error) {
      toast.error('Error publishing result');
    }
  };

  const downloadPDF = async (id, rollNo) => {
    try {
      const response = await axios.get(`/api/results/${id}/download`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `result-${rollNo}-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF downloaded successfully');
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Session expired. Please log in again.');
      } else {
        toast.error('Error downloading PDF');
      }
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Exam Results', 14, 15);
    doc.autoTable({
      startY: 25,
      head: [['Student', 'Exam', 'Score', 'Total', 'Percentage', 'Status']],
      body: results.map(r => [
        r.student_id?.name,
        r.exam_id?.title,
        r.score,
        r.total_marks,
        `${((r.score / r.total_marks) * 100).toFixed(2)}%`,
        r.published ? 'Published' : 'Pending'
      ])
    });
    doc.save('results.pdf');
  };

  const exportExcel = () => {
    const data = results.map(r => ({
      Student: r.student_id?.name,
      Email: r.student_id?.email,
      Exam: r.exam_id?.title,
      Subject: r.exam_id?.subject_id?.subject_name,
      Score: r.score,
      Total: r.total_marks,
      Percentage: `${((r.score / r.total_marks) * 100).toFixed(2)}%`,
      Status: r.published ? 'Published' : 'Pending'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    XLSX.writeFile(wb, 'results.xlsx');
  };

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Results</h1>
          <div className="flex gap-2 sm:gap-4">
            <button onClick={exportPDF} className="bg-red-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center gap-2 hover:bg-red-700 text-sm sm:text-base">
              <Download className="w-4 h-4 sm:w-5 sm:h-5" /> PDF
            </button>
            <button onClick={exportExcel} className="bg-green-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-lg flex items-center gap-2 hover:bg-green-700 text-sm sm:text-base">
              <Download className="w-4 h-4 sm:w-5 sm:h-5" /> Excel
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-indigo-600 text-white">
              <tr>
                <th className="px-6 py-4 text-left">Student</th>
                <th className="px-6 py-4 text-left">Roll No</th>
                <th className="px-6 py-4 text-left">Exam</th>
                <th className="px-6 py-4 text-left">Subject</th>
                <th className="px-6 py-4 text-left">Score</th>
                <th className="px-6 py-4 text-left">Percentage</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r._id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">{r.student_id?.name}</td>
                  <td className="px-6 py-4">{r.student_roll_no}</td>
                  <td className="px-6 py-4">{r.exam_id?.title}</td>
                  <td className="px-6 py-4">{r.exam_id?.subject_id?.subject_name}</td>
                  <td className="px-6 py-4">{r.score}/{r.total_marks}</td>
                  <td className="px-6 py-4">{((r.score / r.total_marks) * 100).toFixed(2)}%</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${r.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {r.published ? 'Published' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {!r.published && (
                        <button onClick={() => handlePublish(r._id)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                          Publish
                        </button>
                      )}
                      <button onClick={() => downloadPDF(r._id, r.student_roll_no)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Results;
