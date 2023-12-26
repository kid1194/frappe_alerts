# Alerts © 2024
# Author:  Ameen Ahmed
# Company: Level Up Marketing & Software Development Services
# Licence: Please refer to LICENSE file


from setuptools import setup, find_packages
from alerts import __version__


with open('requirements.txt') as f:
    install_requires = f.read().strip().split('\n')


setup(
    name='alerts',
    version=__version__,
    description='Frappe app that displays custom alerts to specific recipients.',
    author='Ameen Ahmed (Level Up)',
    author_email='kid1194@gmail.com',
    packages=find_packages(),
    zip_safe=False,
    include_package_data=True,
    install_requires=install_requires
)
