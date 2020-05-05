package data;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import java.awt.Point;

public class JSONC {
	public static void main(String[] args) {
		try {
			ArrayList<PlaceObj> places = new ArrayList<PlaceObj>();
			HashMap<Integer, Intersection> intersections = new HashMap<Integer, Intersection>();
			ArrayList<Road> roads = new ArrayList<Road>();
			HashMap<String, State> states = new HashMap<String, State>();

			System.out.println("Loading Places...");
			File f = new File("data/named-places.txt");
			BufferedReader br = new BufferedReader(new FileReader(f));
			String line;
			while ((line = br.readLine()) != null) {
				String unique = sanitize(line.substring(0, 8));
				String state = sanitize(line.substring(8, 10));
				String name = sanitize(line.substring(10, 50));
				String population = sanitize(line.substring(50, 66));
				String area = sanitize(line.substring(66, 80));
				String lat = sanitize(line.substring(80, 90));
				String lon = sanitize(line.substring(90, 101));
				String inter = sanitize(line.substring(101, 106));
				String dist = sanitize(line.substring(106));
				//if (!state.equals("AK") && !state.equals("HI") && !state.equals("PR"))
					places.add(new PlaceObj(unique, state, name, population, area, lat, lon, inter, dist));
			}
			br.close();

			System.out.println("Loading Intersections...");
			f = new File("data/intersections.txt");
			br = new BufferedReader(new FileReader(f));
			int id = 0;
			int raw_c = 0;
			while ((line = br.readLine()) != null) {
				String lon = sanitize(line.substring(0, 9));
				String lat = sanitize(line.substring(9, 19));
				String state = sanitize(line.substring(28, 30));
				//if (!state.equals("AK") && !state.equals("HI") && !state.equals("PR")) {
					intersections.put(id, new Intersection(Integer.toString(id), state, lon, lat, raw_c));
					raw_c++;
				//}
				id++;
			}
			br.close();

			System.out.println("Loading Roads...");
			f = new File("data/connections.txt");
			br = new BufferedReader(new FileReader(f));
			while ((line = br.readLine()) != null) {
				String[] split = line.split("\s");
				roads.add(new Road(split[0], split[1], split[2], split[3], split[4]));
			}
			br.close();

			System.out.println("Loading States...");
			f = new File("data/states.txt");
			br = new BufferedReader(new FileReader(f));
			while ((line = br.readLine()) != null) {
				if (line.length() == 2) {
					if (!states.containsKey(line))
						states.put(line, new State(line));
					String state = line;
					ArrayList<Point.Double> vertices = new ArrayList<Point.Double>();
					while (!(line = br.readLine()).equals("-1 -1")) {
						String lon_raw = sanitize(line.substring(0, 6));
						String lat_raw = sanitize(line.substring(6, 13));
						double lon = -Double.valueOf(lon_raw) / 1000D;
						double lat = Double.valueOf(lat_raw) / 1000D;
						vertices.add(new Point.Double(lon, lat));
					}
					states.get(state).vertices.add(vertices);
				}
			}
			br.close();

			System.out.println("Repackaging Intersections...");
			for (Map.Entry<Integer, Intersection> e : intersections.entrySet()) {
				for (Road r : roads) {
					if (r.iA.equals(Integer.toString(e.getKey()))) {
						if (!e.getValue().neighbors.containsKey(intersections.get(Integer.parseInt(r.iB))))
							e.getValue().neighbors.put(intersections.get(Integer.parseInt(r.iB)), new ArrayList<Road>());
						e.getValue().neighbors.get(intersections.get(Integer.parseInt(r.iB))).add(r);

						if (!intersections.get(Integer.parseInt(r.iB)).neighbors.containsKey(e.getValue()))
							intersections.get(Integer.parseInt(r.iB)).neighbors.put(e.getValue(), new ArrayList<Road>());
						intersections.get(Integer.parseInt(r.iB)).neighbors.get(e.getValue()).add(r);
					}
				}
			}

			System.out.println("Printing Places to File...");
			BufferedWriter bw = new BufferedWriter(new FileWriter(new File("data.js")));
			bw.write("const PLACES = [\n");
			places.remove(0);
			for (PlaceObj o : places) {
				bw.write(o.toString());
				if (places.get(places.size() - 1) != o) {
					bw.write(",\n");
				}
			}
			bw.write("];\n\n");

			System.out.println("Printing Nodes to File...");
			bw.write("const NODES = {\n");
			int c = 0;
			for (Map.Entry<Integer, Intersection> i : intersections.entrySet()) {
				bw.write(i.getValue().toString());
				if (intersections.size() - 1 != c) {
					bw.write(",\n");
				}
				c++;
			}
			bw.write("};");

			System.out.println("Printing States to File...");
			bw.write("const STATES = {\n");
			c = 0;
			for (Map.Entry<String, State> i : states.entrySet()) {
				bw.write(i.getValue().toString());
				if (intersections.size() - 1 != c) {
					bw.write(",\n");
				}
				c++;
			}
			bw.write("};");

			bw.close();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	public static String sanitize(String s) {
		while (s.charAt(0) == ' ')
			s = s.substring(1);
		while (s.charAt(s.length() - 1) == ' ')
			s = s.substring(0, s.length() - 1);
		return s;
	}
}

class PlaceObj {
	String unique, state, name, population, area, lat, lon, inter, dist;

	public PlaceObj(String unique, String state, String name, String population, String area, String lat, String lon,
			String inter, String dist) {
		this.unique = unique;
		this.state = state;
		this.name = name;
		this.population = population;
		this.area = area;
		this.lat = lat;
		this.lon = lon;
		this.inter = inter;
		this.dist = dist;
	}

	public String toString() {
		String s = "{\n";
		s += "\t\"id\":\"" + unique + "\",\n";
		s += "\t\"state\":\"" + state + "\",\n";
		s += "\t\"name\":\"" + name + "\",\n";
		s += "\t\"pop\":" + population + ",\n";
		s += "\t\"area\":" + area + ",\n";
		s += "\t\"lat\":" + lat + ",\n";
		s += "\t\"lon\":" + lon + ",\n";
		s += "\t\"intersection\":\"" + inter + "\",\n";
		s += "\t\"distance\":" + dist + "\n";
		return s + "}";
	}
}

class Intersection {
	String id, state, lon, lat;
	int raw_c;
	HashMap<Intersection, ArrayList<Road>> neighbors;

	public Intersection(String id, String state, String lon, String lat, int raw_c) {
		neighbors = new HashMap<Intersection, ArrayList<Road>>();
		this.id = id;
		this.state = state;
		this.lon = lon;
		this.lat = lat;
		this.raw_c = raw_c;
	}

	public String toString() {
		String s = "\"" + id + "\":{\n";
		s += "\t\"id\":\"" + id + "\",\n";
		s += "\t\"state\":\"" + state + "\",\n";
		s += "\t\"lat\":" + lat + ",\n";
		s += "\t\"lon\":" + lon + ",\n";
		s += "\t\"neighbors\": {\n";
		int i = 0;
		for (Map.Entry<Intersection, ArrayList<Road>> e : neighbors.entrySet()) {
			s += "\t\t\"" + e.getKey().id + "\": [\n";
			int j = 0;
			for (Road r : e.getValue()) {
				s += "\t\t\t{\n";
				s += "\t\t\t\t\"name\":\"" + r.name + "\",\n";
				s += "\t\t\t\t\"type\":\"" + r.type + "\",\n";
				s += "\t\t\t\t\"length\":" + r.length + "\n";
				s += "\t\t\t}";
				if (j == e.getValue().size() - 1) {
					s += "\n";
				} else {
					s += ",\n";
				}
			}
			s += "\t\t]";
			if (i == neighbors.size() - 1) {
				s += "\n";
			} else {
				s += ",\n";
			}
			i++;
		}
		s += "\t}\n";
		return s + "}";
	}
}

class Road {
	String name, type, iA, iB, length;

	public Road(String name, String type, String iA, String iB, String length) {
		this.name = name;
		this.type = type;
		this.iA = iA;
		this.iB = iB;
		this.length = length;
	}
}

class State {
	String state;
	ArrayList<ArrayList<Point.Double>> vertices;

	public State(String state) {
		this.state = state;
		vertices = new ArrayList<ArrayList<Point.Double>>();
	}

	public String toString() {
		String s = "\"" + state + "\":[\n";
		for (ArrayList<Point.Double> list : vertices) {
			s += "\t[\n";
			for (Point.Double vertex : list) {
				s += "\t\t{\"lon\":" + vertex.x + ", \"lat\":" + vertex.y + "}";
				if (list.get(list.size() - 1) == vertex) {
					s += "\n";
				} else {
					s += ",\n";
				}
			}
			s += "]";
			if (vertices.get(vertices.size() - 1) == list) {
				s += "\n";
			} else {
				s += ",\n";
			}
		}
		return s + "]";
	}
}