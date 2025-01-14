"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useFormik } from "formik";
import * as Yup from "yup";
import Layout from "@/app/components/admin/Layout";
import './CustomerManagement.css'; // Import CSS custom nếu cần
import '../../globals.css';
import '../../admin_header.css'; // Import global styles

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Fetch customers from API
  useEffect(() => {
    axios
      .get("http://localhost:3000/taikhoan")
      .then((response) => {
        const sortedCustomers = response.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt) // Sort by registration time
        );
        setCustomers(sortedCustomers);
      })
      .catch((error) => console.error("Error fetching customers:", error));
  }, []);
  // Toggle add/edit form visibility
  const toggleForm = (customer = null) => {
    setShowForm(!showForm);
    setEditMode(!!customer);
    setSelectedCustomer(customer);
    if (customer) {
      formik.setValues({
        tentaikhoan: customer.tentaikhoan,
        gioitinh: customer.gioitinh,
        sdt: customer.sdt,
        ngaysinh: customer.ngaysinh,
        email: customer.email,
        vaitro: customer.vaitro,
        trangthai: customer.trangthai,
      });
    } else {
      formik.resetForm();
    }
  };

  // Formik for handling form submission
  const formik = useFormik({
    initialValues: {
      tentaikhoan: "",
      gioitinh: "",
      sdt: "",
      ngaysinh: "",
      email: "",
      matkhau: "",
      rematkhau: "",
      trangthai: "",
      vaitro: "",
    },
    validationSchema: Yup.object({
      tentaikhoan: Yup.string().required("Vui lòng nhập tên tài khoản"),
      gioitinh: Yup.string().required("Vui lòng chọn giới tính"),
      sdt: Yup.string()
        .matches(/^[0-9]+$/, "Số điện thoại không hợp lệ")
        .required("Vui lòng nhập số điện thoại"),
      ngaysinh: Yup.string().required("Vui lòng chọn ngày sinh"),
      email: Yup.string().email("Email không hợp lệ").required("Vui lòng nhập email"),
      matkhau: !editMode
        ? Yup.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").required("Vui lòng nhập mật khẩu")
        : Yup.string(),
      rematkhau: !editMode
        ? Yup.string()
            .oneOf([Yup.ref("matkhau"), null], "Mật khẩu xác nhận không khớp")
            .required("Vui lòng xác nhận mật khẩu")
        : Yup.string(),
    }),
    onSubmit: async (values) => {
      try {
        if (editMode) {
          const { tentaikhoan, gioitinh, sdt, ngaysinh, email, vaitro, trangthai } = values;
          const response = await axios.put(`http://localhost:3000/taikhoan/${selectedCustomer._id}`, {
            tentaikhoan,
            gioitinh,
            sdt,
            ngaysinh,
            email,
            vaitro,
            trangthai,
          });
          if (response.status === 200) {
            alert("Cập nhật thành công!");
            setCustomers(customers.map((customer) =>
              customer._id === selectedCustomer._id ? response.data : customer
            ));
          }
        } else {
          const response = await axios.post("http://localhost:3000/register/add", {
            tentaikhoan: values.tentaikhoan,
            gioitinh: values.gioitinh,
            sdt: values.sdt,
            ngaysinh: values.ngaysinh,
            email: values.email,
            matkhau: values.matkhau,
            rematkhau: values.rematkhau,
          });
          if (response.status === 201) {
            alert("Đăng ký thành công!");
            setCustomers([...customers, response.data]);
          }
        }
        setShowForm(false);
        formik.resetForm();
      } catch (error) {
        console.error(editMode ? "Error updating customer:" : "Error adding customer:", error);
        alert(editMode ? "Cập nhật không thành công. Vui lòng thử lại." : "Đăng ký không thành công. Vui lòng thử lại.");
      }
    },
  });

  // Handle delete customer
  const deleteCustomer = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa khách hàng này?")) {
      try {
        await axios.delete(`http://localhost:3000/taikhoan/${id}`);
        setCustomers(customers.filter((customer) => customer._id !== id));
        alert("Xóa khách hàng thành công!");
      } catch (error) {
        console.error("Error deleting customer:", error);
        alert("Xóa khách hàng không thành công. Vui lòng thử lại.");
      }
    }
  };

  // Toggle status between Active and Inactive with confirmation
  const toggleStatus = async (customer) => {
    const newStatus = customer.trangthai === "hoạt động" ? "ngưng hoạt động" : "hoạt động";
    const confirmMessage = `Bạn có chắc chắn muốn thay đổi trạng thái thành "${newStatus}"?`;

    if (window.confirm(confirmMessage)) {
      try {
        const response = await axios.put(`http://localhost:3000/taikhoan/${customer._id}`, {
          ...customer,
          trangthai: newStatus,
        });
        if (response.status === 200) {
          setCustomers(customers.map((c) =>
            c._id === customer._id ? { ...c, trangthai: newStatus } : c
          ));
        }
      } catch (error) {
        console.error("Error updating status:", error);
        alert("Không thể thay đổi trạng thái. Vui lòng thử lại.");
      }
    }
  };

  // Toggle role between Admin and User with confirmation
  const toggleRole = async (customer) => {
    const newRole = customer.vaitro === "Admin" ? "user" : "Admin";
    const confirmMessage = `Bạn có chắc chắn muốn thay đổi vai trò thành "${newRole}"?`;

    if (window.confirm(confirmMessage)) {
      try {
        const response = await axios.put(`http://localhost:3000/taikhoan/${customer._id}`, {
          ...customer,
          vaitro: newRole,
        });
        if (response.status === 200) {
          setCustomers(customers.map((c) =>
            c._id === customer._id ? { ...c, vaitro: newRole } : c
          ));
        }
      } catch (error) {
        console.error("Error updating role:", error);
        alert("Không thể thay đổi vai trò. Vui lòng thử lại.");
      }
    }
  };

  return (
    <Layout>
      <div className="customer-management">
        <h2>Quản Lý Khách Hàng</h2>
        <p>Đây là trang quản lý đơn hàng</p>
        <div className="add-account-container">
        <button onClick={() => toggleForm()} className="add-button">
          Thêm Tài Khoản
        </button>
        </div>
        

        {showForm && (
          <div className="modal-overlay">
            <div className="modal-register container">
              <button onClick={() => toggleForm()} className="close-modal">
                &times;
              </button>
              <h2>{editMode ? "Chỉnh Sửa Khách Hàng" : "Đăng Ký Khách Hàng"}</h2>
              <form onSubmit={formik.handleSubmit}>
                <div>
                  <label>Tên tài khoản</label>
                  <input
                    type="text"
                    name="tentaikhoan"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.tentaikhoan}
                  />
                  {formik.touched.tentaikhoan && formik.errors.tentaikhoan ? (
                    <div>{formik.errors.tentaikhoan}</div>
                  ) : null}
                </div>
                <div>
                  <label>Giới tính</label>
                  <select
                    name="gioitinh"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.gioitinh}
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                  {formik.touched.gioitinh && formik.errors.gioitinh ? (
                    <div>{formik.errors.gioitinh}</div>
                  ) : null}
                </div>
                <div>
                  <label>Ngày sinh</label>
                  <input
                    type="date"
                    name="ngaysinh"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.ngaysinh}
                  />
                  {formik.touched.ngaysinh && formik.errors.ngaysinh ? (
                    <div>{formik.errors.ngaysinh}</div>
                  ) : null}
                </div>
                <div>
                  <label>Số điện thoại</label>
                  <input
                    type="text"
                    name="sdt"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.sdt}
                  />
                  {formik.touched.sdt && formik.errors.sdt ? (
                    <div>{formik.errors.sdt}</div>
                  ) : null}
                </div>
             
                <div>
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.email}
                  />
                  {formik.touched.email && formik.errors.email ? (
                    <div>{formik.errors.email}</div>
                  ) : null}
                </div>
                {!editMode && (
                  <>
                    <div>
                      <label>Mật khẩu</label>
                      <input
                        type="password"
                        name="matkhau"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.matkhau}
                      />
                      {formik.touched.matkhau && formik.errors.matkhau ? (
                        <div>{formik.errors.matkhau}</div>
                      ) : null}
                    </div>
                    <div>
                      <label>Xác nhận mật khẩu</label>
                      <input
                        type="password"
                        name="rematkhau"
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        value={formik.values.rematkhau}
                      />
                      {formik.touched.rematkhau && formik.errors.rematkhau ? (
                        <div>{formik.errors.rematkhau}</div>
                      ) : null}
                    </div>
                  </>
                )}
                <button type="submit1">{editMode ? "Cập Nhật" : "Đăng Ký"}</button>
              </form>
            </div>
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên Tài Khoản</th>
              <th>Email</th>
              <th>SDT</th>
              <th>Ngày Sinh</th>
              <th>Trạng thái</th>
              <th>Vai Trò</th>
              <th>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer, index) => (
              <tr key={customer._id}>
                <td>{index + 1}</td>
                <td>{customer.tentaikhoan}</td>
                <td>{customer.email}</td>
                <td>{customer.sdt}</td>
                <td>{new Date(customer.ngaysinh).toLocaleDateString("vi-VN")}</td>
                <td>
                  <button onClick={() => toggleStatus(customer)} className="status-button">
                    {customer.trangthai}
                  </button>
                </td>
                <td>
                  <button onClick={() => toggleRole(customer)} className="role-button">
                    {customer.vaitro}
                  </button>
                </td>
                <td>
  <div className="action-buttons">
    <button className="edit-button" onClick={() => toggleForm(customer)}>
      Sửa
    </button>
    <button className="delete-icon" onClick={() => deleteCustomer(customer._id)}>
      Xóa
    </button>
  </div>
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default CustomerManagement;



