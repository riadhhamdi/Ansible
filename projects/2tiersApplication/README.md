# PythonAPI
This is a set of shell script and Ansible playbook that will deploy a REST API in few minutes. 


# Prerequisites
A virtual machine / a container containing RHEL/Centos/Fedora/ArchLinux Operating system or equivalent image for the container. 

# About this API 
This is a python Flask API. 
The Script and the playbook will install Ansible locally on the machine , deploy a database server and a webserver 
The web server is running a WSGI script. 
You do not need to do custom modifications.

# Installation
` # git clone https://github.com/riadhhamdi/PythonAPI.git `

` # cd PythonAPI`

` # bash setup.sh`

# Usage

At the end of the process the API is ready and you can start using it 

- To get the list of employees 

GET http://<ip_of_your_server>/api/employees      

- to add a new employee

POST http://<ip_of_your_server>/api/employees

`{
"FirstName": "MyFirstName",
"LastName": "MyLastName",
"Email": "myemail@mycompany.com"
}`


- to delete an employee

DELETE http://<ip_of_your_server>/api/employees/<id_of_employee>

